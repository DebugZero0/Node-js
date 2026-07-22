import { useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { useChat } from "../hooks/useChat"
import { createPortal } from "react-dom"
import TypingIndicator from "../components/TypingIndicator"
import { Send,Mic,MicOff } from "lucide-react"
import { useAuth } from "../../auth/hooks/useAuth"
import { useUser } from "../hooks/useUser"
import ProjectModal from "../../projects/components/ProjectModel.jsx"

import {
  SparklesIcon,
  MicrophoneIcon,
  ArrowUpIcon,
  CodeBracketIcon,
  CodeBracketSquareIcon,
} from "@heroicons/react/24/outline"


const DELAYS = ["delay-0", "delay-75", "delay-100", "delay-150", "delay-200", "delay-300", "delay-500"]

function renderInlineMarkdown(text, keyPrefix) {
  const content = String(text || "")
  const parts = []
  const inlinePattern = /(\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*)/g
  let lastIndex = 0
  let match

  while ((match = inlinePattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }

    const key = `${keyPrefix}-${match.index}`
    const [, token, linkText, href, codeText, boldText, italicText] = match

    if (linkText && href) {
      const isSafeLink = /^https?:\/\//i.test(href)
      parts.push(
        isSafeLink ? (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-200 underline decoration-zinc-500 underline-offset-4 transition-colors hover:text-white"
          >
            {linkText}
          </a>
        ) : (
          token
        )
      )
    } else if (codeText) {
      parts.push(
        <code key={key} className="rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 text-[0.85em] text-zinc-200">
          {codeText}
        </code>
      )
    } else if (boldText) {
      parts.push(
        <strong key={key} className="font-semibold text-white">
          {boldText}
        </strong>
      )
    } else if (italicText) {
      parts.push(
        <em key={key} className="text-zinc-300">
          {italicText}
        </em>
      )
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return parts
}

function renderMarkdownLines(lines, keyPrefix) {
  return lines.flatMap((line, index) => {
    const renderedLine = renderInlineMarkdown(line, `${keyPrefix}-line-${index}`)
    return index === 0 ? renderedLine : [<br key={`${keyPrefix}-br-${index}`} />, ...renderedLine]
  })
}

function InlineMarkdownText({ content, fallback }) {
  const text = String(content || fallback || "")
  return renderInlineMarkdown(text, "inline-md")
}

function MarkdownMessage({ content }) {
  const lines = String(content || "").split(/\r?\n/)
  const blocks = []
  let paragraphLines = []
  let index = 0

  function flushParagraph() {
    if (paragraphLines.length === 0) return

    const key = `paragraph-${blocks.length}`
    blocks.push(
      <p key={key} className="whitespace-pre-wrap">
        {renderMarkdownLines(paragraphLines, key)}
      </p>
    )
    paragraphLines = []
  }

  while (index < lines.length) {
    const line = lines[index]

    if (!line.trim()) {
      flushParagraph()
      index += 1
      continue
    }

    const codeFence = line.match(/^```(\w+)?\s*$/)
    if (codeFence) {
      flushParagraph()
      const codeLines = []
      index += 1

      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        codeLines.push(lines[index])
        index += 1
      }

      if (index < lines.length) index += 1

      blocks.push(
        <pre key={`code-${blocks.length}`} className="my-3 overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-3 text-xs leading-5 text-zinc-100">
          <code>{codeLines.join("\n")}</code>
        </pre>
      )
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      const level = heading[1].length
      const headingClass = level === 1 ? "text-lg" : level === 2 ? "text-base" : "text-sm"
      const HeadingTag = `h${level + 2}`

      blocks.push(
        <HeadingTag key={`heading-${blocks.length}`} className={`mt-4 first:mt-0 font-semibold leading-6 text-white ${headingClass}`}>
          {renderInlineMarkdown(heading[2], `heading-${blocks.length}`)}
        </HeadingTag>
      )
      index += 1
      continue
    }

    const quote = line.match(/^>\s?(.*)$/)
    if (quote) {
      flushParagraph()
      const quoteLines = []

      while (index < lines.length) {
        const quoteLine = lines[index].match(/^>\s?(.*)$/)
        if (!quoteLine) break
        quoteLines.push(quoteLine[1])
        index += 1
      }

      blocks.push(
        <blockquote key={`quote-${blocks.length}`} className="my-3 border-l-2 border-zinc-600 pl-3 text-zinc-400">
          {renderMarkdownLines(quoteLines, `quote-${blocks.length}`)}
        </blockquote>
      )
      continue
    }

    const unorderedListItem = line.match(/^\s*[-*]\s+(.+)$/)
    if (unorderedListItem) {
      flushParagraph()
      const items = []

      while (index < lines.length) {
        const item = lines[index].match(/^\s*[-*]\s+(.+)$/)
        if (!item) break
        items.push(item[1])
        index += 1
      }

      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-2 ml-5 list-disc space-y-1">
          {items.map((item, itemIndex) => (
            <li key={`ul-${blocks.length}-${itemIndex}`}>
              {renderInlineMarkdown(item, `ul-${blocks.length}-${itemIndex}`)}
            </li>
          ))}
        </ul>
      )
      continue
    }

    const orderedListItem = line.match(/^\s*\d+[.)]\s+(.+)$/)
    if (orderedListItem) {
      flushParagraph()
      const items = []

      while (index < lines.length) {
        const item = lines[index].match(/^\s*\d+[.)]\s+(.+)$/)
        if (!item) break
        items.push(item[1])
        index += 1
      }

      blocks.push(
        <ol key={`ol-${blocks.length}`} className="my-2 ml-5 list-decimal space-y-1">
          {items.map((item, itemIndex) => (
            <li key={`ol-${blocks.length}-${itemIndex}`}>
              {renderInlineMarkdown(item, `ol-${blocks.length}-${itemIndex}`)}
            </li>
          ))}
        </ol>
      )
      continue
    }

    paragraphLines.push(line)
    index += 1
  }

  flushParagraph()

  return <div className="space-y-2 text-sm leading-6 text-inherit">{blocks}</div>
}

// ================================================================
// Icon components
// ================================================================

import {
  ChatBubbleIcon,
  PlusIcon,
  TrashIcon,
  DotsIcon,
  EditIcon,
  EditIcon2,
  LogoutIcon,
  CopyIcon,
  CloseIcon,
  SendIcon,
  ArrowLeftIcon,
  SearchGlassIcon,
  InfoIcon,
  PinIcon,
  MenuIcon,
  GlassAvatar} from "../components/IconFunction.jsx"

function MessageSkeletonList() {
  const skeletonMessages = [
    { align: "justify-start", width: "max-w-[min(680px,88%)]", lines: ["w-24", "w-full", "w-5/6", "w-2/3"] },
    { align: "justify-end", width: "max-w-[min(520px,78%)]", lines: ["w-20", "w-full", "w-3/5"] },
    { align: "justify-start", width: "max-w-[min(720px,88%)]", lines: ["w-28", "w-full", "w-11/12", "w-4/6"] },
  ]

  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading messages">
      <span className="sr-only">Loading messages</span>
      {skeletonMessages.map((item, index) => (
        <div key={`message-skeleton-${index}`} className={`flex ${item.align}`}>
          <div
            className={`${item.width} w-full animate-pulse rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3`}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className={`${item.lines[0]} h-3 rounded-full bg-white/10`} />
              <span className="h-1 w-1 rounded-full bg-white/10" />
              <span className="h-3 w-12 rounded-full bg-white/10" />
            </div>
            <div className="space-y-2">
              {item.lines.slice(1).map((lineWidth, lineIndex) => (
                <span key={`message-skeleton-line-${index}-${lineIndex}`} className={`block h-3 rounded-full bg-white/10 ${lineWidth}`} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatMessageActionTime(timestamp) {
  if (!timestamp) return "Now"

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return "Now"

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Reusable, breakpoint-aware modal shell.
 */
function ModalShell({ open, onClose, labelledBy, size = "md", children }) {
  if (!open) return null

  const sizeClass =
    size === "sm" ? "max-w-[min(92vw,26rem)]" : size === "lg" ? "max-w-[min(94vw,40rem)]" : "max-w-[min(92vw,28rem)]"

  return (
    <div
      className="fixed inset-0 z-[65] flex items-end justify-center bg-black/60 backdrop-blur-md sm:items-center sm:px-4"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`w-full ${sizeClass} rounded-t-3xl border border-white/10 bg-[#0d0d0f] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.6)] sm:rounded-2xl sm:p-6 max-h-[88vh] overflow-y-auto`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Shared confirm/destructive-action dialog.
 */
function ConfirmDialog({
  open,
  onClose,
  eyebrow,
  title,
  description,
  confirmLabel,
  pendingLabel,
  onConfirm,
  pending,
  tone = "danger",
}) {
  const confirmClass =
    tone === "danger"
      ? "bg-rose-500 hover:bg-rose-400 focus-visible:ring-rose-300/50 text-white"
      : "bg-white hover:bg-zinc-200 focus-visible:ring-white/40 text-black"

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="confirm-dialog-title" size="sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="min-w-0">
          {eyebrow ? <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-600">{eyebrow}</p> : null}
          <h3 id="confirm-dialog-title" className="mt-1 text-lg font-semibold text-white sm:text-xl">
            {title}
          </h3>
        </div>
      </div>

      {description ? <p className="text-sm leading-6 text-zinc-500">{description}</p> : null}

      <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={Boolean(pending)}
          className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-zinc-200 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.07] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={Boolean(pending)}
          className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus-visible:ring-2 ${confirmClass}`}
        >
          {pending ? pendingLabel : confirmLabel}
        </button>
      </div>
    </ModalShell>
  )
}

// ================================================================
// Sidebar section label
// ================================================================
function SidebarSectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 px-1 pb-1 pt-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-zinc-600">{children}</span>
      <span className="h-px flex-1 bg-white/[0.05]" />
    </div>
  )
}

// ================================================================
// Chat list item — extracted for reuse in pinned + all sections
// ================================================================
function ChatListItem({
  item,
  index,
  isActive,
  isDeleting,
  isMenuOpen,
  isPinned,
  drawerOpen,
  chatSearchOpen,
  menuPosition,
  onSelect,
  onOpenMenu,
  onStartEdit,
  onDelete,
  onTogglePin,
}) {
  const delayClass = DELAYS[Math.min(index, DELAYS.length - 1)]

  return (
    <div
      key={item._id}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item._id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect(item._id)
        }
      }}
      className={`group relative w-full rounded-xl border p-3.5 pr-11 text-left transition-all ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
        drawerOpen ? `translate-x-0 opacity-100 duration-300 ${delayClass}` : "-translate-x-2 opacity-0 duration-200"
      } ${
        isActive
          ? "border-white/15 bg-white/[0.07]"
          : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.04]"
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-white" />
      )}

      {/* Pin badge — small amber dot when pinned */}
      {isPinned && (
        <span
          className="absolute right-10 top-3 flex h-4 w-4 items-center justify-center"
          title="Pinned"
          aria-label="Pinned"
        >
          <PinIcon className="h-3 w-3 text-amber-400" pinned />
        </span>
      )}

      <button
        type="button"
        onClick={(event) => onOpenMenu(item._id, event)}
        aria-label={`Chat actions for ${item.title || "chat"}`}
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        data-chat-menu-button="true"
        className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 opacity-100 transition-all duration-150 hover:bg-white/[0.08] hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
      >
        <DotsIcon className="h-4 w-4" />
      </button>

      {isMenuOpen && menuPosition
        ? createPortal(
          <div
            data-chat-menu-panel="true"
            role="menu"
            aria-label="Chat actions"
            style={{ top: menuPosition.top, left: Math.max(8, menuPosition.left) }}
            className="fixed z-[200] w-44 rounded-xl border border-white/10 bg-[#141416] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Pin / Unpin */}
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation()
                onTogglePin(item._id)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-200 transition-colors hover:bg-white/[0.08] hover:text-white focus:outline-none focus:bg-white/[0.08]"
            >
              <PinIcon className="h-4 w-4 text-amber-400" pinned={isPinned} />
              <span>{isPinned ? "Unpin" : "Pin"}</span>
            </button>
            {/* Rename */}
            <button
              type="button"
              role="menuitem"
              onClick={(event) => onStartEdit(item, event)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-200 transition-colors hover:bg-white/[0.08] hover:text-white focus:outline-none focus:bg-white/[0.08]"
            >
              <EditIcon className="h-4 w-4 text-zinc-400" />
              <span>Rename</span>
            </button>
            {/* Delete */}
            <button
              type="button"
              role="menuitem"
              onClick={(event) => onDelete(item._id, event)}
              disabled={isDeleting}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-200 transition-colors hover:bg-rose-500/10 hover:text-rose-200 focus:outline-none focus:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4 text-rose-400" />
              <span>Delete</span>
            </button>
          </div>,
          document.body
        )
        : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-100">
            <InlineMarkdownText content={item.title} fallback="New chat" />
          </p>
        </div>
      </div>
    </div>
  )
}

const PINNED_STORAGE_KEY = "perplexity_pinned_chats"

const Dashboard = () => {
  const {
    initializeSocketConnection,
    sendMessageSocket,
    onAiStart,
    onAiChunk,
    onAiDone,
    onAiError,
    deleteChat,
    getChats,
    getMessages,
    updateChatTitle,
  } = useChat()
  const { handleLogout } = useAuth()
  const user = useSelector((state) => state.auth.user)
  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [inputValue, setInputValue] = useState("")
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [deletingChatId, setDeletingChatId] = useState(null)
  const [pendingDeleteChatId, setPendingDeleteChatId] = useState(null)
  const [menuOpenChatId, setMenuOpenChatId] = useState(null)
  const [editingChatId, setEditingChatId] = useState(null)
  const [editTitleValue, setEditTitleValue] = useState("")
  const [savingChatTitle, setSavingChatTitle] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const [error, setError] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [scrollState, setScrollState] = useState({ top: 0, atBottom: true })
  const [menuPosition, setMenuPosition] = useState(null)
  const [showUserInfo, setShowUserInfo] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [editingUserName, setEditingUserName] = useState(false)
  const [newUserName, setNewUserName] = useState("")
  const [savingUserName, setSavingUserName] = useState(false)
  const [deletingUser, setDeletingUser] = useState(false)
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false)
  const [chatSearchOpen, setChatSearchOpen] = useState(false)
  const [chatSearchQuery, setChatSearchQuery] = useState("")
  const streamingMessageIdRef = useRef(null)
  const streamingChatIdRef = useRef(null)
  const pendingUserMessageIdRef = useRef(null)
  const suppressMessageLoadForChatIdRef = useRef(null)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)

  // ── Pin state (persisted to localStorage) ──────────────────────────
  const [pinnedChatIds, setPinnedChatIds] = useState(() => {
    try {
      const stored = localStorage.getItem(PINNED_STORAGE_KEY)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  function togglePinChat(chatId) {
    setPinnedChatIds((prev) => {
      const next = new Set(prev)
      if (next.has(chatId)) {
        next.delete(chatId)
      } else {
        next.add(chatId)
      }
      try {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify([...next]))
      } catch {
        // storage might be unavailable
      }
      // Close the menu
      setMenuOpenChatId(null)
      setMenuPosition(null)
      return next
    })
  }

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const sidebarScrollRef = useRef(null)
  const chatSearchInputRef = useRef(null)
  const formRef = useRef(null)

  function resizeInputHeight() {
    const inputElement = inputRef.current
    if (!inputElement) return
    const maxHeight = 160
    inputElement.style.height = "auto"
    inputElement.style.height = `${Math.min(inputElement.scrollHeight, maxHeight)}px`
    inputElement.style.overflowY = inputElement.scrollHeight > maxHeight ? "auto" : "hidden"
  }

  function openChatSearch() {
    setDrawerOpen(true)
    setChatSearchOpen(true)
    requestAnimationFrame(() => chatSearchInputRef.current?.focus())
  }

  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event) => {
      let transcript = ""
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setInputValue(transcript)
      resizeInputHeight()
    }

    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition

    return () => recognition.stop()
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setInputValue("")
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

    useEffect(() => {
      initializeSocketConnection()

      const offStart = onAiStart(({ chat, userMessage }) => {
        setChats((currentChats) => {
          const exists = currentChats.some((c) => c._id === chat._id)
          if (exists) return currentChats.map((c) => (c._id === chat._id ? { ...c, ...chat } : c))
          return [chat, ...currentChats]
        })
        setActiveChatId((prev) => {
          if (!prev) {
            suppressMessageLoadForChatIdRef.current = chat._id
          }
          return prev || chat._id
        })
        streamingChatIdRef.current = chat._id

        // Swap the optimistic temp user message for the real saved one
        setMessages((current) =>
          current.map((m) => (m._id === pendingUserMessageIdRef.current ? userMessage : m))
        )

        // Placeholder assistant bubble we'll stream tokens into
        const placeholderId = `temp-assistant-${Date.now()}`
        streamingMessageIdRef.current = placeholderId
        setMessages((current) => [
          ...current,
          { _id: placeholderId, role: "assistant", content: "", createdAt: new Date().toISOString() },
        ])
      })

      const offChunk = onAiChunk(({ chatId, token }) => {
        if (chatId !== streamingChatIdRef.current) return
        const targetId = streamingMessageIdRef.current
        setMessages((current) =>
          current.map((m) => (m._id === targetId ? { ...m, content: m.content + token } : m))
        )
      })

      const offDone = onAiDone(({ chat, aiMessage }) => {
        const targetId = streamingMessageIdRef.current
        setChats((currentChats) => {
          const remaining = currentChats.filter((c) => c._id !== chat._id)
          return [chat, ...remaining]
        })
        setMessages((current) => current.map((m) => (m._id === targetId ? aiMessage : m)))
        streamingMessageIdRef.current = null
        streamingChatIdRef.current = null
        pendingUserMessageIdRef.current = null
        setSendingMessage(false)
      })

      const offError = onAiError(({ error: errMsg }) => {
        setError(errMsg || "Failed to generate AI response")
        setSendingMessage(false)
        streamingMessageIdRef.current = null
        streamingChatIdRef.current = null
        pendingUserMessageIdRef.current = null
      })

      return () => {
        offStart()
        offChunk()
        offDone()
        offError()
      }
    }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    let mounted = true
    async function loadChats() {
      setLoadingChats(true)
      setError("")
      try {
        const data = await getChats()
        if (!mounted) return
        setChats(data.chats || [])
      } catch (fetchError) {
        if (!mounted) return
        setError(fetchError.response?.data?.error || "Failed to load chats")
      } finally {
        if (mounted) setLoadingChats(false)
      }
    }
    loadChats()
    return () => { mounted = false }
  }, [getChats])

  useEffect(() => {
    if (!activeChatId) { setMessages([]); return }

    if (suppressMessageLoadForChatIdRef.current === activeChatId) {
      suppressMessageLoadForChatIdRef.current = null
      return
    }

    let mounted = true
    async function loadMessages() {
      setLoadingMessages(true)
      setError("")
      try {
        const data = await getMessages(activeChatId)
        if (!mounted) return
        setMessages(data.messages || [])
      } catch (fetchError) {
        if (!mounted) return
        setError(fetchError.response?.data?.error || "Failed to load messages")
      } finally {
        if (mounted) setLoadingMessages(false)
      }
    }
    loadMessages()
    return () => { mounted = false }
  }, [activeChatId, getMessages])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  useEffect(() => {
    if (!drawerOpen) return
    function handleKeyDown(event) { if (event.key === "Escape") setDrawerOpen(false) }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [drawerOpen])

  useEffect(() => {
    if (!drawerOpen) { setChatSearchOpen(false); setChatSearchQuery("") }
  }, [drawerOpen])

  useEffect(() => {
    if (!infoOpen) return
    function handleKeyDown(event) { if (event.key === "Escape") setInfoOpen(false) }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [infoOpen])

  useEffect(() => {
    if (!showUserInfo) return
    function handleKeyDown(event) { if (event.key === "Escape") setShowUserInfo(false) }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [showUserInfo])

  useEffect(() => {
    function handlePointerDown(event) {
      const target = event.target
      if (!(target instanceof Element)) return
      const insideMenuButton = target.closest("[data-chat-menu-button]")
      const insideMenuPanel = target.closest("[data-chat-menu-panel]")
      if (!insideMenuButton && !insideMenuPanel) {
        setMenuOpenChatId(null)
        setMenuPosition(null)
      }
    }
    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [])

  useEffect(() => {
    if (!menuOpenChatId) return
    function handleKeyDown(event) { if (event.key === "Escape") setMenuOpenChatId(null) }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [menuOpenChatId])

  useEffect(() => {
    if (!chatSearchOpen) return
    function handleKeyDown(event) {
      if (event.key === "Escape") { setChatSearchOpen(false); setChatSearchQuery("") }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [chatSearchOpen])

  const { updateUserName, deleteUser, getQuota } = useUser()
  const [quota, setQuota] = useState(null)

  useEffect(() => {
    if (!showUserInfo) return
    let mounted = true
    getQuota().then((data) => { if (mounted) setQuota(data) }).catch(() => {})
    return () => { mounted = false }
  }, [showUserInfo])
  const activeChat = useMemo(
    () => chats.find((item) => item._id === activeChatId) || null,
    [chats, activeChatId]
  )

  // ── Pinned / unpinned split ─────────────────────────────────────────
  const { pinnedChats, unpinnedChats } = useMemo(() => {
    const pinned = []
    const unpinned = []
    for (const chat of chats) {
      if (pinnedChatIds.has(chat._id)) pinned.push(chat)
      else unpinned.push(chat)
    }
    return { pinnedChats: pinned, unpinnedChats: unpinned }
  }, [chats, pinnedChatIds])

  function handleSidebarScroll(event) {
    const { scrollTop, scrollHeight, clientHeight } = event.target
    setScrollState({ top: scrollTop, atBottom: scrollTop + clientHeight >= scrollHeight - 4 })
    if (menuOpenChatId) { setMenuOpenChatId(null); setMenuPosition(null) }
  }

    async function handleSendMessage(event) {
      event.preventDefault()
      const trimmedMessage = inputValue.trim()
      if (!trimmedMessage || sendingMessage) return

      setSendingMessage(true)
      setError("")

      const tempUserMessage = {
        _id: `temp-user-${Date.now()}`,
        role: "user",
        content: trimmedMessage,
        createdAt: new Date().toISOString(),
      }
      pendingUserMessageIdRef.current = tempUserMessage._id

      setMessages((current) => [...current, tempUserMessage])
      setInputValue("")
      requestAnimationFrame(resizeInputHeight)

      try {
        sendMessageSocket(trimmedMessage, activeChatId, activeChatId ? undefined : selectedProject?._id)
      } catch (sendError) {
        setError("Failed to send message")
        setMessages((current) => current.filter((m) => m._id !== tempUserMessage._id))
        setInputValue(trimmedMessage)
        setSendingMessage(false)
      }
    }

  function handleSelectChat(chatId) {
    setActiveChatId(chatId)
    setDrawerOpen(false)
    setMenuOpenChatId(null)
  }

  function openChatMenu(chatId, event) {
    event.stopPropagation()
    if (menuOpenChatId === chatId) { setMenuOpenChatId(null); setMenuPosition(null); return }
    const rect = event.currentTarget.getBoundingClientRect()
    setMenuPosition({ top: rect.bottom - 6, left: rect.right - 176 })
    setMenuOpenChatId(chatId)
  }

  function startEditChat(chat, event) {
    event.stopPropagation()
    setMenuOpenChatId(null)
    setEditingChatId(chat._id)
    setEditTitleValue(chat.title || "")
  }

  function handleDeleteChat(chatId, event) {
    event.stopPropagation()
    setMenuOpenChatId(null)
    if (deletingChatId) return
    setPendingDeleteChatId(chatId)
  }

  async function saveChatTitle(event) {
    event.preventDefault()
    if (!editingChatId || savingChatTitle) return
    const trimmedTitle = editTitleValue.trim()
    if (!trimmedTitle) { setError("Chat title cannot be empty"); return }
    setSavingChatTitle(true)
    setError("")
    try {
      const data = await updateChatTitle(editingChatId, trimmedTitle)
      setChats((currentChats) =>
        currentChats.map((item) => (item._id === editingChatId ? { ...item, ...data.chat } : item))
      )
      setEditingChatId(null)
      setEditTitleValue("")
    } catch (updateError) {
      setError(updateError.response?.data?.error || "Failed to update chat title")
    } finally {
      setSavingChatTitle(false)
    }
  }

  function closeEditChatTitle() {
    if (savingChatTitle) return
    setEditingChatId(null)
    setEditTitleValue("")
  }

  async function confirmDeleteChat() {
    if (!pendingDeleteChatId || deletingChatId) return
    const chatId = pendingDeleteChatId
    setDeletingChatId(chatId)
    setError("")
    try {
      await deleteChat(chatId)
      setChats((currentChats) => {
        const remainingChats = currentChats.filter((item) => item._id !== chatId)
        if (activeChatId === chatId) { setActiveChatId(remainingChats[0]?._id || null); setMessages([]) }
        return remainingChats
      })
      // Also remove from pinned if pinned
      setPinnedChatIds((prev) => {
        const next = new Set(prev)
        next.delete(chatId)
        try { localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify([...next])) } catch {}
        return next
      })
    } catch (deleteError) {
      setError(deleteError.response?.data?.error || "Failed to delete chat")
    } finally {
      setDeletingChatId(null)
      setPendingDeleteChatId(null)
    }
  }

  function cancelDeleteChat() {
    if (deletingChatId) return
    setPendingDeleteChatId(null)
  }

  function handleNewChat() {
    setActiveChatId(null)
    setMessages([])
    setInputValue("")
    setDrawerOpen(false)
    setMenuOpenChatId(null)
    setChatSearchOpen(false)
    setChatSearchQuery("")
    requestAnimationFrame(resizeInputHeight)
  }

  function toggleChatSearch() {
    setChatSearchOpen((current) => {
      const next = !current
      if (!next) setChatSearchQuery("")
      return next
    })
    setMenuOpenChatId(null)
    requestAnimationFrame(() => chatSearchInputRef.current?.focus())
  }

  function closeChatSearch() {
    setChatSearchOpen(false)
    setChatSearchQuery("")
  }

  function handleSelectSearchedChat(chatId) {
    handleSelectChat(chatId)
    closeChatSearch()
  }

  function handleEditMessageDraft(message) {
    setInputValue(message.content || "")
    requestAnimationFrame(() => { resizeInputHeight(); inputRef.current?.focus() })
  }

  async function handleCopyMessage(message) {
    const content = String(message.content || "")
    if (!content) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content)
      } else {
        const textarea = document.createElement("textarea")
        textarea.value = content
        textarea.setAttribute("readonly", "")
        textarea.style.position = "fixed"
        textarea.style.opacity = "0"
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      }
      setCopiedMessageId(message._id)
      window.setTimeout(() => {
        setCopiedMessageId((currentId) => (currentId === message._id ? null : currentId))
      }, 1400)
    } catch {
      setError("Failed to copy message")
    }
  }

  function startEditUserName() {
    setNewUserName(user?.username || user?.name || "")
    setEditingUserName(true)
  }

  async function handleUpdateUserName(event) {
    event.preventDefault()
    const trimmedName = newUserName.trim()
    if (!trimmedName) { setError("User name cannot be empty"); return }
    if (trimmedName === (user?.username || user?.name)) { setEditingUserName(false); return }
    setSavingUserName(true)
    setError("")
    try {
      await updateUserName(trimmedName)
      setEditingUserName(false)
    } catch (updateError) {
      setError(updateError.response?.data?.error || "Failed to update name")
    } finally {
      setSavingUserName(false)
    }
  }

  function handleCancelEditUserName() {
    if (savingUserName) return
    setNewUserName(user?.username || user?.name || "")
    setEditingUserName(false)
  }

  const sidebarChats = chats
  const trimmedSearchQuery = chatSearchQuery.trim().toLowerCase()

  // When searching, flatten all chats; otherwise use pinned/unpinned split
  const searchedChats = trimmedSearchQuery
    ? sidebarChats.filter((item) => (item.title || "New chat").toLowerCase().includes(trimmedSearchQuery))
    : null

  const pendingDeleteChat = pendingDeleteChatId
    ? chats.find((item) => item._id === pendingDeleteChatId) || null
    : null
  const userLabel = user?.username || user?.name || "Guest"
  const userInitial = userLabel.charAt(0).toUpperCase()

  // Shared props for ChatListItem
  const chatListItemProps = {
    drawerOpen,
    chatSearchOpen,
    menuPosition,
    onSelect: chatSearchOpen ? handleSelectSearchedChat : handleSelectChat,
    onOpenMenu: openChatMenu,
    onStartEdit: startEditChat,
    onDelete: handleDeleteChat,
    onTogglePin: togglePinChat,
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a0b] text-zinc-100">
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 9999px; }
        .sidebar-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; scroll-behavior: smooth; }
        .scrollbar-chat::-webkit-scrollbar { width: 5px; }
        .scrollbar-chat::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-chat::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.09); border-radius: 9999px; }
        .scrollbar-chat { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.09) transparent; }
      `}</style>

      {/* ================================================================ */}
      {/* Collapsed rail — persistent from md upward                       */}
      {/* ================================================================ */}
      <nav
        className={`fixed inset-y-0 left-0 z-30 hidden w-16 flex-col items-center border-r border-white/[0.06] bg-[#0d0d0f] py-4 transition-all duration-500 ease-out md:flex md:w-[55px] md:py-5 ${mounted ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
          }`}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open chat navigation"
          aria-expanded={drawerOpen}
          title="Open sidebar"
          className={`mb-6 flex h-9 w-9 items-center justify-center rounded-xl text-zinc-300 shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out hover:border-white/20 hover:bg-[#121212] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${drawerOpen ? "pointer-events-none scale-95 opacity-0" : "scale-100 opacity-100"
            }`}
        >
          <MenuIcon open={drawerOpen} />
        </button>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleNewChat}
            title="New chat"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] text-zinc-300 transition-all duration-150 hover:border-white/20 hover:bg-[#121212] hover:text-white active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={openChatSearch}
            title="Search chats"
            className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] text-zinc-300 transition-all duration-150 hover:border-white/20 hover:bg-[#121212] hover:text-white active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <SearchGlassIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="h-px w-8 bg-white/5" />

        <div className="mt-4 flex w-full flex-1 flex-col items-center gap-2 overflow-y-auto overflow-x-hidden">
          {/* Pinned chats first in rail */}
          {pinnedChats.slice(0, 4).map((item) => {
            const isActive = item._id === activeChatId
            return (
              <button
                key={`pin-rail-${item._id}`}
                type="button"
                title={`[Pinned] ${item.title || "Chat"}`}
                onClick={() => handleSelectChat(item._id)}
                className={`relative flex h-9 w-9 shrink-0 items-center border justify-center rounded-xl transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${isActive
                  ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                  : "border-amber-400/20 hover:bg-amber-400/10 text-amber-500/60 hover:text-amber-300"
                  }`}
              >
                {isActive && <span className="absolute -left-2 h-5 w-[3px] rounded-full bg-amber-400" />}
                <PinIcon className="h-3.5 w-3.5" pinned />
              </button>
            )
          })}

          {pinnedChats.length > 0 && unpinnedChats.length > 0 && (
            <div className="h-px w-6 bg-white/[0.06] my-1" />
          )}

          {unpinnedChats.slice(0, 8 - Math.min(pinnedChats.length, 4)).map((item) => {
            const isActive = item._id === activeChatId
            return (
              <button
                key={item._id}
                type="button"
                title={item.title || "Chat"}
                onClick={() => handleSelectChat(item._id)}
                className={`relative flex h-9 w-9 shrink-0 items-center border border-white/[0.06] justify-center rounded-xl transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${isActive
                  ? "border-white/20 bg-white/[0.09] text-white"
                  : "border-white/[0.06] hover:bg-[#121212] text-zinc-500 hover:border-white/15 hover:text-zinc-200"
                  }`}
              >
                {isActive && <span className="absolute -left-2 h-5 w-[3px] rounded-full bg-white" />}
                <ChatBubbleIcon className="h-4 w-4" />
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          title={userLabel}
          className="mt-4 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          <GlassAvatar label={userInitial} size="h-9 w-9" text="text-xs" />
        </button>
      </nav>

      {/* ================================================================ */}
      {/* Backdrop                                                          */}
      {/* ================================================================ */}
      <div
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${drawerOpen
          ? "pointer-events-auto opacity-100 duration-300 ease-out"
          : "pointer-events-none opacity-0 duration-200 ease-in"
          }`}
      />

      {/* ================================================================ */}
      {/* Expanded drawer                                                   */}
      {/* ================================================================ */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Chat navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-[290px] flex-col overflow-hidden border-r border-white/[0.06] bg-[#0d0d0f] shadow-[0_30px_90px_rgba(0,0,0,0.6)] transition-all sm:w-[300px] lg:w-[320px] ${drawerOpen
          ? "translate-x-0 opacity-100 duration-300 ease-out"
          : "pointer-events-none -translate-x-full opacity-0 duration-200 ease-in"
          }`}
      >
        {/* Drawer header */}
        <div
          className={`relative shrink-0 border-b border-white/[0.06] p-4 transition-all duration-300 ease-out sm:p-5 ${drawerOpen ? "translate-y-0 opacity-100 delay-75" : "-translate-y-2 opacity-0"
            }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Perplexity</p>
              <h1 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">Chats</h1>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close chat navigation"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-transparent text-zinc-400 transition-colors duration-150 hover:border-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="group w-full flex flex-1 items-center gap-3 rounded-xl bg-transparent px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors duration-150 hover:bg-black hover:text-zinc-100 focus:outline-none"
            >
              <PlusIcon className="h-5 w-5 shrink-0 rounded-full bg-white/[0.1] p-0.5 transition-all duration-200 ease-out group-hover:scale-110 group-hover:rotate-5 group-active:scale-95 group-active:rotate-0" />
              <span>New chat</span>
            </button>
            <button
              type="button"
              onClick={() => setProjectModalOpen(true)}
              className="group w-full flex flex-1 items-center gap-3 rounded-xl bg-transparent px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors duration-150 hover:bg-black hover:text-zinc-100 focus:outline-none"
          >
              <span className="group flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                  <CodeBracketSquareIcon className="h-5 w-5 shrink-0 rounded-full  transition-all duration-200 ease-in-out group-hover:scale-110 group-active:scale-95" />
              </span>
              <span>{selectedProject ? selectedProject.name : "Project"}</span>
          </button>
            <button
              type="button"
              onClick={toggleChatSearch}
              aria-label={chatSearchOpen ? "Close chat search" : "Search chats"}
              aria-expanded={chatSearchOpen}
              title="Search chats"
              className={`group w-full flex flex-1 items-center gap-3 rounded-xl bg-transparent px-3 py-2.5 text-sm font-medium ${chatSearchOpen
                ? "border-white/20 bg-white/[0.09] text-white"
                : "border-transparent text-zinc-400 hover:bg-black hover:text-zinc-100"
                }`}
            >
              <SearchGlassIcon className="h-5 w-5 shrink-0 rounded-full p-0.5 transition-all duration-200 ease-in-out group-hover:scale-110 group-hover:rotate-5 group-active:scale-95 group-active:rotate-0" />
              <span>Search chats</span>
            </button>
          </div>

          {/* Search panel */}
          <div
            className={`grid transition-all duration-250 cubic-bezier(.22,1,.36,1) ${chatSearchOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
          >
            <div className="overflow-hidden">
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 focus-within:border-white/25 focus-within:ring-2 focus-within:ring-white/10">
                <input
                  ref={chatSearchInputRef}
                  type="text"
                  value={chatSearchQuery}
                  onChange={(event) => setChatSearchQuery(event.target.value)}
                  placeholder="Search chats by title..."
                  aria-label="Search chats by title"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                />
                {chatSearchQuery ? (
                  <button
                    type="button"
                    onClick={() => setChatSearchQuery("")}
                    aria-label="Clear search"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:text-zinc-200 focus:outline-none"
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Chat list */}
        <div className="relative min-h-0 flex-1">
          <div
            ref={sidebarScrollRef}
            onScroll={handleSidebarScroll}
            className="sidebar-scroll h-full overflow-y-auto overscroll-contain p-3 pr-2"
          >
            <div className="flex flex-col gap-1">
              {loadingChats ? (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-zinc-500">
                  Loading conversations...
                </div>
              ) : sidebarChats.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-500">
                  No chats yet. Start a new conversation from the composer.
                </div>
              ) : searchedChats !== null ? (
                // ── Search results (flat list) ──────────────────────────
                searchedChats.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-500">
                    No chats match "{chatSearchQuery.trim()}".
                  </div>
                ) : (
                  searchedChats.map((item, index) => (
                    <ChatListItem
                      key={item._id}
                      item={item}
                      index={index}
                      isActive={item._id === activeChatId}
                      isDeleting={deletingChatId === item._id}
                      isMenuOpen={menuOpenChatId === item._id}
                      isPinned={pinnedChatIds.has(item._id)}
                      {...chatListItemProps}
                    />
                  ))
                )
              ) : (
                // ── Normal view: pinned then all ────────────────────────
                <>
                  {pinnedChats.length > 0 && (
                    <>
                      <SidebarSectionLabel>Pinned</SidebarSectionLabel>
                      {pinnedChats.map((item, index) => (
                        <ChatListItem
                          key={`pinned-${item._id}`}
                          item={item}
                          index={index}
                          isActive={item._id === activeChatId}
                          isDeleting={deletingChatId === item._id}
                          isMenuOpen={menuOpenChatId === item._id}
                          isPinned
                          {...chatListItemProps}
                        />
                      ))}
                      {unpinnedChats.length > 0 && (
                        <SidebarSectionLabel>All chats</SidebarSectionLabel>
                      )}
                    </>
                  )}
                  {unpinnedChats.map((item, index) => (
                    <ChatListItem
                      key={item._id}
                      item={item}
                      index={index}
                      isActive={item._id === activeChatId}
                      isDeleting={deletingChatId === item._id}
                      isMenuOpen={menuOpenChatId === item._id}
                      isPinned={false}
                      {...chatListItemProps}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Scroll gradient fades */}
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#0d0d0f] to-transparent transition-opacity duration-300 ${scrollState.top > 4 ? "opacity-100" : "opacity-0"}`}
          />
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0d0d0f] to-transparent transition-opacity duration-300 ${scrollState.atBottom ? "opacity-0" : "opacity-100"}`}
          />
        </div>

        {/* Drawer footer */}
        <div
          className={`relative shrink-0 border-t border-white/[0.06] p-3 transition-all duration-300 ease-out sm:p-4 ${drawerOpen ? "translate-y-0 opacity-100 delay-150" : "translate-y-3 opacity-0"
            }`}
        >
          <button
            type="button"
            onClick={() => setShowUserInfo(true)}
            aria-label="Show user information"
            className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-colors duration-150 hover:border-white/15 hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <GlassAvatar label={userInitial} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{userLabel}</p>
              <p className="truncate text-xs text-zinc-500">{user?.email || "Free plan"}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* ================================================================ */}
      {/* Floating menu toggle — mobile / tablet only                      */}
      {/* ================================================================ */}
      {window.innerWidth < 768 && (
        <button
          type="button"
          onClick={() => setDrawerOpen((current) => !current)}
          aria-label={drawerOpen ? "Close chat navigation" : "Open chat navigation"}
          aria-expanded={drawerOpen}
          className={`fixed top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#0d0d0f]/80 text-zinc-300 backdrop-blur-md transition-all duration-300 ease-out hover:border-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${drawerOpen ? "left-4 opacity-0 pointer-events-none" : "left-4 rotate-0 opacity-100 pointer-events-auto"
            }`}
        >
          <MenuIcon open={drawerOpen} />
        </button>
      )}

      {/* ================================================================ */}
      {/* Main content                                                      */}
      {/* ================================================================ */}
      <div className="fixed inset-0 flex flex-col md:pl-16 lg:pl-[72px]">
        <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-20 flex-shrink-0 relative bg-[#0a0a0b]/80 px-4 py-3.5 backdrop-blur-xl sm:px-5 sm:py-4 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="min-w-0 truncate pl-14 text-sm font-medium text-white sm:text-base md:pl-2 flex items-center gap-2">
                {activeChat && pinnedChatIds.has(activeChat._id) && (
                  <PinIcon className="h-3.5 w-3.5 shrink-0 text-amber-400" pinned />
                )}
                <InlineMarkdownText content={activeChat?.title} fallback="New conversation" />
              </h2>
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                aria-label="Show app information"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors duration-150 hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <InfoIcon className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="scrollbar-chat min-h-0 flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 pt-1 pb-26">
                <div className="mx-auto w-full max-w-3xl">
                  {error ? (
                    <div className="mb-5 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-sm text-rose-300">
                      {error}
                    </div>
                  ) : null}

                  {loadingMessages ? (
                    <MessageSkeletonList />
                  ) : messages.length === 0 ? (
                    <div className="flex min-h-[50vh] items-center justify-center sm:min-h-[55vh]">
                      <div className="max-w-md text-center">
                        <h3 className="text-xl font-semibold text-white sm:text-2xl lg:text-3xl">Ask anything</h3>
                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                          Pick a chat from the sidebar or start a new one.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
                          {["MERN Stack", "LangChain", "WebRTC", "AI Integration"].map((item) => (
                            <button
                              key={item}
                              className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-zinc-300 transition hover:bg-white/10 sm:px-4 sm:text-sm"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {messages.map((message) => {
                        const isUserMessage = message.role === "user"
                        const actionTime = formatMessageActionTime(message.createdAt)

                        return (
                          <div
                            key={message._id}
                            className={`group/message flex ${isUserMessage ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`flex max-w-[92%] flex-col sm:max-w-[85%] lg:max-w-[75%] ${isUserMessage ? "items-end" : "items-start"}`}
                            >
                              <div
                                className={`max-w-full rounded-2xl border px-4 py-3 ${isUserMessage
                                  ? "border-transparent bg-white/[0.06] text-zinc-100"
                                  : "border-transparent bg-black/5 text-zinc-100"
                                  }`}
                              >
                                {isUserMessage ? (
                                    <p className="whitespace-pre-wrap text-sm leading-6 text-inherit">{message.content}</p>
                                  ) : message.content ? (
                                    <MarkdownMessage content={message.content} />
                                  ) : (
                                    <div className="flex min-h-6 items-center text-zinc-300">
                                      <TypingIndicator />
                                    </div>
                                  )}
                              </div>

                              <div
                                className={`mt-1 flex min-h-8 flex-wrap items-center gap-1 text-[11px] text-zinc-500 opacity-100 transition-all duration-150 ease-in-out sm:opacity-0 sm:group-hover/message:opacity-100 sm:group-focus-within/message:opacity-100 ${isUserMessage ? "justify-end" : "justify-start"}`}
                              >
                                <span className="mr-1 whitespace-nowrap">{actionTime}</span>
                                <button
                                  type="button"
                                  onClick={() => handleEditMessageDraft(message)}
                                  aria-label="Edit message"
                                  title="Edit message"
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-zinc-500 transition-colors duration-150 hover:border-white/15 hover:bg-white/[0.07] hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                                >
                                  <EditIcon className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyMessage(message)}
                                  aria-label="Copy message"
                                  title="Copy message"
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-zinc-500 transition-colors duration-150 hover:border-white/15 hover:bg-white/[0.07] hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                                >
                                  <CopyIcon className="h-3.5 w-3.5" />
                                </button>
                                {copiedMessageId === message._id ? (
                                  <span className="whitespace-nowrap px-1 text-zinc-300">Copied</span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {sendingMessage && !streamingMessageIdRef.current ? (
                        <div className="flex justify-start">
                          <div className="min-h-[44px] max-w-[92%] rounded-2xl border border-transparent px-4 py-3 text-zinc-100 sm:max-w-[85%] lg:max-w-[75%]">
                            <div className="flex min-h-6 items-center text-zinc-300">
                              <TypingIndicator />
                            </div>
                          </div>
                        </div>
                      ) : null}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
              </div>

              {/* Composer */}
              <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-shrink-0 justify-center border-t border-white/[0.04] px-3 py-3 backdrop-blur-xl sm:px-6 sm:py-4 lg:px-8">
                <form onSubmit={handleSendMessage} ref={formRef} className="w-xl max-w-xl p-0 sm:max-w-2xl sm:p-1 lg:max-w-3xl">
                  <div className="flex items-center gap-2 rounded-2xl bg-[#131316] px-2 py-1.5 sm:px-3">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(event) => {
                        setInputValue(event.target.value)
                        resizeInputHeight()
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey && !sendingMessage && inputValue.trim()) {
                          event.preventDefault()
                          formRef.current?.requestSubmit()
                        }
                      }}
                      rows={1}
                      placeholder="Ask something or start a new chat..."
                      className="min-h-11 flex-1 resize-none overflow-hidden rounded-xl bg-[#131316] px-3 py-2.5 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 transition-colors duration-150 scrollbar-thumb-zinc-700 scrollbar-track-transparent scrollbar-thin sm:min-h-12 sm:px-4 sm:py-3"
                    />
                    <button
                      type="button"
                      onClick={toggleListening}
                      aria-label={isListening ? "Stop recording" : "Start voice input"}
                      className={`relative flex h-9 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all duration-150 ease-out active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:w-11 ${
                        isListening
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-transparent text-zinc-200 hover:text-zinc-100"
                      }`}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                    <button
                      type="submit"
                      disabled={sendingMessage || !inputValue.trim()}
                      aria-label="Send message"
                      className="relative flex h-9 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-black transition-all duration-150 ease-out hover:bg-zinc-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 disabled:active:scale-100 sm:w-11"
                    >
                      <ArrowLeftIcon className="h-4 w-4 rotate-180" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ================================================================ */}
      {/* App info modal                                                    */}
      {/* ================================================================ */}
      <ModalShell open={infoOpen} onClose={() => setInfoOpen(false)} labelledBy="app-info-title" size="lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-600">About this app</p>
            <h3 id="app-info-title" className="mt-1 text-xl font-semibold text-white sm:text-2xl">
              Project Perplexity
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setInfoOpen(false)}
            aria-label="Close app information"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors duration-150 hover:border-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 space-y-4 text-sm leading-6 text-zinc-400">
          <p>
            This app is a chat workspace for creating conversations, reading message history,
            and keeping long threads usable in the right-hand panel.
          </p>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">Creator</p>
            <p className="mt-2 text-base font-semibold text-white">Ankan Nandi</p>
            <p className="mt-1 text-sm text-zinc-500">Built for the Project Perplexity workspace.</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">What it does</p>
            <ul className="mt-2 space-y-1 text-zinc-400">
              <li>• Open chats from the sidebar and continue any thread.</li>
              <li>• Send messages from the composer at the bottom.</li>
              <li>• Delete chats when you want to clear a conversation.</li>
            </ul>
          </div>
        </div>
      </ModalShell>

      {/* ================================================================ */}
      {/* User info / account modal                                        */}
      {/* ================================================================ */}
      <ModalShell open={showUserInfo} onClose={() => setShowUserInfo(false)} labelledBy="user-info-title" size="md">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-600">User information</p>
            <h3 id="user-info-title" className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">
              {userLabel}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowUserInfo(false)}
            aria-label="Close user information"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors duration-150 hover:border-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 space-y-4 text-sm leading-6 text-zinc-400">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">Email</p>
            <p className="mt-2 truncate text-base font-semibold text-white">{user?.email || "N/A"}</p>
          </div>
            {quota?.enabled ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-600 ">Credits used : </p>
              <p className="mt-2 text-base font-semibold text-white">
                {quota.used} / {quota.limit}
              </p>
              {quota.remaining === 0 && (
                <p className="mt-1 text-xs text-rose-300">
                  Limit reached — contact the developer to increase your limit.
                </p>
              )}
            </div>
          ) : null}
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:gap-3 sm:p-4">
            <button
              type="button"
              onClick={startEditUserName}
              className="flex flex-col items-center justify-center gap-2 rounded-lg py-3 text-xs font-semibold text-white transition-all duration-150 brightness-50 hover:brightness-100 focus:outline-none active:scale-95"
            >
              <EditIcon2 className="h-5 w-5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteUserConfirm(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-lg py-3 text-xs font-semibold text-white transition-all duration-150 brightness-50 hover:brightness-100 focus:outline-none active:scale-95"
            >
              <TrashIcon className="h-5 w-5" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-lg py-3 text-xs font-semibold text-white transition-all duration-150 brightness-50 hover:brightness-100 focus:outline-none active:scale-95"
            >
              <LogoutIcon className="h-5 w-5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </ModalShell>

      {/* Logout confirm */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        eyebrow="Confirm logout"
        title="Are you sure you want to log out?"
        confirmLabel="Log out"
        pendingLabel="Logging out..."
        onConfirm={handleLogout}
        pending={false}
        tone="danger"
      />

      {/* Delete chat confirm */}
      <ConfirmDialog
        open={Boolean(pendingDeleteChat)}
        onClose={cancelDeleteChat}
        eyebrow="Confirm deletion"
        title="Are you sure you want to delete it?"
        description={
          pendingDeleteChat ? (
            <>
              This will permanently remove{" "}
              <span className="text-zinc-300">
                <InlineMarkdownText content={pendingDeleteChat.title} fallback="this chat" />
              </span>{" "}
              and its messages.
            </>
          ) : null
        }
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        onConfirm={confirmDeleteChat}
        pending={Boolean(deletingChatId)}
        tone="danger"
      />

      {/* Rename chat */}
      <ModalShell open={Boolean(editingChatId)} onClose={closeEditChatTitle} labelledBy="edit-chat-title" size="sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-600">Edit chat title</p>
            <h3 id="edit-chat-title" className="mt-1 text-lg font-semibold text-white sm:text-xl">
              Rename this conversation
            </h3>
          </div>
        </div>
        <form onSubmit={saveChatTitle} className="space-y-4">
          <div>
            <label htmlFor="chat-title-input" className="mb-2 block text-sm text-zinc-400">New chat title</label>
            <input
              id="chat-title-input"
              type="text"
              value={editTitleValue}
              onChange={(event) => setEditTitleValue(event.target.value)}
              autoFocus
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white/25 focus:ring-2 focus:ring-white/10"
              placeholder="Enter a new title"
            />
          </div>
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={closeEditChatTitle}
              disabled={savingChatTitle}
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-zinc-200 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.07] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingChatTitle || !editTitleValue.trim()}
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black transition-all duration-150 hover:bg-zinc-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {savingChatTitle ? "Saving..." : "Update title"}
            </button>
          </div>
        </form>
      </ModalShell>

      {/* Edit user name */}
      <ModalShell open={editingUserName} onClose={handleCancelEditUserName} labelledBy="edit-username-title" size="sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-600">Edit your name</p>
            <h3 id="edit-username-title" className="mt-1 text-lg font-semibold text-white sm:text-xl">
              Update your name
            </h3>
          </div>
        </div>
        <form onSubmit={handleUpdateUserName} className="space-y-4">
          <div>
            <label htmlFor="username-input" className="mb-2 block text-sm text-zinc-400">New name</label>
            <input
              id="username-input"
              type="text"
              value={newUserName}
              onChange={(event) => setNewUserName(event.target.value)}
              autoFocus
              disabled={savingUserName}
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white/25 focus:ring-2 focus:ring-white/10 disabled:opacity-50"
              placeholder="Enter your new name"
            />
          </div>
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={handleCancelEditUserName}
              disabled={savingUserName}
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-zinc-200 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.07] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingUserName || !newUserName.trim()}
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black transition-all duration-150 hover:bg-zinc-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {savingUserName ? "Saving..." : "Update"}
            </button>
          </div>
        </form>
      </ModalShell>

      {/* Delete account confirm */}
      <ConfirmDialog
        open={showDeleteUserConfirm}
        onClose={() => setShowDeleteUserConfirm(false)}
        eyebrow="Delete user"
        title="Are you sure you want to delete your account?"
        confirmLabel="Delete account"
        pendingLabel="Deleting..."
        onConfirm={async () => {
          setDeletingUser(true)
          await deleteUser()
          setDeletingUser(false)
          setShowDeleteUserConfirm(false)
        }}
        pending={deletingUser}
        tone="danger"
      />
      {/* Project modal */}
      <ProjectModal
          open={projectModalOpen}
          onClose={() => setProjectModalOpen(false)}
          selectedProjectId={selectedProject?._id}
          onSelectProject={setSelectedProject}
      />
    </main>
  )
}

export default Dashboard