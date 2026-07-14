import { useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { useChat } from "../hooks/useChat"
import { createPortal } from "react-dom"
import TypingIndicator from "../components/TypingIndicator"
import { Send } from "lucide-react"

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

function ChatBubbleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.5a.6.6 0 0 1-.98-.46V16h-.32A2.5 2.5 0 0 1 4 13.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlusIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 3.75h6m-8.25 3h10.5m-9.75 0 .75 11.25A1.5 1.5 0 0 0 9.75 19.5h4.5a1.5 1.5 0 0 0 1.5-1.5l.75-11.25M10.5 9.75v6m3-6v6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DotsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="6" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="18" cy="12" r="1.6" fill="currentColor" />
    </svg>
  )
}

function EditIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4.75 19.25h3.6l9.1-9.1a1.5 1.5 0 0 0 0-2.12l-1.48-1.48a1.5 1.5 0 0 0-2.12 0l-9.1 9.1v3.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="m13.5 6.5 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CopyIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="10"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M6 15.5h-.5A1.5 1.5 0 0 1 4 14V5.5A1.5 1.5 0 0 1 5.5 4H14a1.5 1.5 0 0 1 1.5 1.5V6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CloseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function SendIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4.5 12 19.5 4.5 15 19.5l-3.4-6.1L4.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
function ArrowLeftIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 17v-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 8.5h.01" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function MenuIcon({ open }) {
  return (
    <span className="relative flex h-4 w-4 items-center justify-center">
      <span
        className={`absolute h-[1.5px] w-4 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${open ? "translate-y-0 rotate-45" : "-translate-y-[5px] rotate-0"
          }`}
      />
      <span
        className={`absolute h-[1.5px] w-4 rounded-full bg-current transition-all duration-200 ease-out ${open ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
          }`}
      />
      <span
        className={`absolute h-[1.5px] w-4 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${open ? "translate-y-0 -rotate-45" : "translate-y-[5px] rotate-0"
          }`}
      />
    </span>
  )
}

function GlassAvatar({ label, size = "h-10 w-10", text = "text-sm" }) {
  return (
    <span
      className={`inline-flex ${size} shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-800 ${text} font-semibold text-zinc-200 transition-colors duration-200 hover:bg-zinc-700`}
    >
      {label}
    </span>
  )
}

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

const Dashboard = () => {
  const { initializeSocketConnection, deleteChat, getChats, getMessages, sendMessage, updateChatTitle } = useChat()
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

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const sidebarScrollRef = useRef(null)

  function resizeInputHeight() {
    const inputElement = inputRef.current
    if (!inputElement) return

    const maxHeight = 160
    inputElement.style.height = "auto"
    inputElement.style.height = `${Math.min(inputElement.scrollHeight, maxHeight)}px`
    inputElement.style.overflowY = inputElement.scrollHeight > maxHeight ? "auto" : "hidden"
  }

  useEffect(() => {
    initializeSocketConnection()
  }, [initializeSocketConnection])

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

        const chatList = data.chats || []
        setChats(chatList)

        if (chatList.length > 0) {
          setActiveChatId((currentId) => currentId || chatList[0]._id)
        }
      } catch (fetchError) {
        if (!mounted) return
        setError(fetchError.response?.data?.error || "Failed to load chats")
      } finally {
        if (mounted) {
          setLoadingChats(false)
        }
      }
    }

    loadChats()

    return () => {
      mounted = false
    }
  }, [getChats])

  useEffect(() => {
    if (!activeChatId) {
      setMessages([])
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
        if (mounted) {
          setLoadingMessages(false)
        }
      }
    }

    loadMessages()

    return () => {
      mounted = false
    }
  }, [activeChatId, getMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!drawerOpen) return

    function handleKeyDown(event) {
      if (event.key === "Escape") setDrawerOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [drawerOpen])

  useEffect(() => {
    if (!infoOpen) return

    function handleKeyDown(event) {
      if (event.key === "Escape") setInfoOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [infoOpen])

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

    function handleKeyDown(event) {
      if (event.key === "Escape") setMenuOpenChatId(null)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [menuOpenChatId])

  const activeChat = useMemo(
    () => chats.find((item) => item._id === activeChatId) || null,
    [chats, activeChatId]
  )

  function handleSidebarScroll(event) {
    const { scrollTop, scrollHeight, clientHeight } = event.target
    setScrollState({
      top: scrollTop,
      atBottom: scrollTop + clientHeight >= scrollHeight - 4,
    })
    if (menuOpenChatId) {
      setMenuOpenChatId(null)
      setMenuPosition(null)
    }
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

    try {
      setMessages((currentMessages) => [...currentMessages, tempUserMessage])
      setInputValue("")
      requestAnimationFrame(resizeInputHeight)

      const data = await sendMessage(trimmedMessage, activeChatId)
      const updatedChat = data.chat

      setChats((currentChats) => {
        const remainingChats = currentChats.filter((item) => item._id !== updatedChat._id)
        return [updatedChat, ...remainingChats]
      })
      setActiveChatId(updatedChat._id)

      const refreshedMessages = await getMessages(updatedChat._id)
      setMessages(refreshedMessages.messages || [])
    } catch (sendError) {
      setError(sendError.response?.data?.error || "Failed to send message")
      setMessages((currentMessages) => currentMessages.filter((item) => item._id !== tempUserMessage._id))
      setInputValue(trimmedMessage)
    } finally {
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

    if (menuOpenChatId === chatId) {
      setMenuOpenChatId(null)
      setMenuPosition(null)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    setMenuPosition({ top: rect.bottom - 6, left: rect.right - 176 }) // 176px = w-44
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
    if (!trimmedTitle) {
      setError("Chat title cannot be empty")
      return
    }

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

        if (activeChatId === chatId) {
          setActiveChatId(remainingChats[0]?._id || null)
          setMessages([])
        }

        return remainingChats
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
    requestAnimationFrame(resizeInputHeight)
  }

  function handleEditMessageDraft(message) {
    setInputValue(message.content || "")
    requestAnimationFrame(() => {
      resizeInputHeight()
      inputRef.current?.focus()
    })
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

  const sidebarChats = chats
  const pendingDeleteChat = pendingDeleteChatId
    ? chats.find((item) => item._id === pendingDeleteChatId) || null
    : null
  const userLabel = user?.username || user?.name || "Guest"
  const userInitial = userLabel.charAt(0).toUpperCase()

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

      {/* ---------------------------------------------------------------- */}
      {/* Collapsed rail — permanent on md+, hidden on mobile               */}
      {/* ---------------------------------------------------------------- */}
      <nav
        className={`fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col items-center border-r border-white/[0.06] bg-[#0d0d0f] py-5 transition-all duration-500 ease-out md:flex ${mounted ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
          }`}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open chat navigation"
          aria-expanded={drawerOpen}
          title="Open sidebar"
          className={`mb-6 flex h-10 w-11 items-center justify-center rounded-xl text-zinc-300 shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out hover:border-white/20 hover:bg-[#121212] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${drawerOpen ? "pointer-events-none scale-95 opacity-0" : "scale-100 opacity-100"
            }`}
        >
          <MenuIcon open={drawerOpen} />
        </button>

        <button
          type="button"
          onClick={handleNewChat}
          title="New chat"
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 transition-all duration-150 hover:border-white/20 hover:bg-white/[0.07] hover:text-white active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 "
        >
          <PlusIcon className="h-4 w-4" />
        </button>

        <div className="h-px w-8 bg-white/[0.06]" />

        <div className="mt-4 flex w-full flex-1 flex-col items-center gap-2 overflow-hidden">
          {sidebarChats.slice(0, 8).map((item) => {
            const isActive = item._id === activeChatId
            return (
              <button
                key={item._id}
                type="button"
                title={item.title || "Chat"}
                onClick={() => handleSelectChat(item._id)}
                className={`relative flex h-10 w-12 items-center border border-white/[0.06] justify-center rounded-xl transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${isActive
                  ? "border-white/20 bg-white/[0.09] text-white"
                  : "border-white/[0.06] hover:bg-[#121212] text-zinc-500 hover:border-white/15 hover:text-zinc-200"
                  }`}
              >
                {isActive && (
                  <span className="absolute -left-2 h-5 w-[3px] rounded-full bg-white" />
                )}
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

      {/* ---------------------------------------------------------------- */}
      {/* Backdrop                                                          */}
      {/* ---------------------------------------------------------------- */}
      <div
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${drawerOpen
          ? "pointer-events-auto opacity-100 duration-300 ease-out"
          : "pointer-events-none opacity-0 duration-200 ease-in"
          }`}
      />

      {/* ---------------------------------------------------------------- */}
      {/* Expanded drawer — responsive width overlay, slides in on x        */}
      {/* ---------------------------------------------------------------- */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Chat navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[300px] flex-col overflow-hidden border-r border-white/[0.06] bg-[#0d0d0f] shadow-[0_30px_90px_rgba(0,0,0,0.6)] transition-all sm:w-[280px] ${drawerOpen
          ? "translate-x-0 opacity-100 duration-300 ease-out"
          : "pointer-events-none -translate-x-full opacity-0 duration-200 ease-in"
          }`}
      >
        <div
          className={`relative border-b border-white/[0.06] p-5 transition-all duration-300 ease-out ${drawerOpen ? "translate-y-0 opacity-100 delay-75" : "-translate-y-2 opacity-0"
            }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Perplexity</p>
              <h1 className="mt-1 truncate text-2xl font-semibold text-white">Chats</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNewChat}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-medium text-zinc-100 transition-colors duration-150 hover:border-white/25 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New chat</span>
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close chat navigation"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors duration-150 hover:border-white/20 hover:text-white md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

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
              ) : (
                sidebarChats.map((item, index) => {
                  const isActive = item._id === activeChatId
                  const isDeleting = deletingChatId === item._id
                  const isMenuOpen = menuOpenChatId === item._id
                  const delayClass = DELAYS[Math.min(index, DELAYS.length - 1)]

                  return (
                    <div
                      key={item._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectChat(item._id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          handleSelectChat(item._id)
                        }
                      }}
                      className={`group relative w-full rounded-xl border p-3.5 pr-11 text-left transition-all ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${drawerOpen ? `translate-x-0 opacity-100 duration-300 ${delayClass}` : "-translate-x-2 opacity-0 duration-200"
                        } ${isActive
                          ? "border-white/15 bg-white/[0.07]"
                          : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.04]"
                        }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-white" />
                      )}

                      <button
                        type="button"
                        onClick={(event) => openChatMenu(item._id, event)}
                        aria-label={`Chat actions for ${item.title || "chat"}`}
                        aria-expanded={isMenuOpen}
                        aria-haspopup="menu"
                        data-chat-menu-button="true"
                        className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 opacity-0 transition-all duration-150 hover:bg-white/[0.08] hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 group-hover:opacity-100 group-focus-within:opacity-100"
                      >
                        <DotsIcon className="h-4 w-4" />
                      </button>

                      {isMenuOpen && menuPosition
                        ? createPortal(
                          <div
                            data-chat-menu-panel="true"
                            role="menu"
                            aria-label="Chat actions"
                            style={{ top: menuPosition.top, left: menuPosition.left }}
                            className="fixed z-[200] w-44 rounded-xl border border-white/10 bg-[#141416] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(event) => startEditChat(item, event)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-200 transition-colors hover:bg-white/[0.08] hover:text-white focus:outline-none focus:bg-white/[0.08]"
                            >
                              <EditIcon className="h-4 w-4 text-zinc-400" />
                              <span>Rename</span>
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(event) => handleDeleteChat(item._id, event)}
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
                })
              )}
            </div>
          </div>

          {/* scroll gradient fades */}
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#0d0d0f] to-transparent transition-opacity duration-300 ${scrollState.top > 4 ? "opacity-100" : "opacity-0"
              }`}
          />
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0d0d0f] to-transparent transition-opacity duration-300 ${scrollState.atBottom ? "opacity-0" : "opacity-100"
              }`}
          />
        </div>

        <div
          className={`relative border-t border-white/[0.06] p-4 transition-all duration-300 ease-out ${drawerOpen ? "translate-y-0 opacity-100 delay-150" : "translate-y-3 opacity-0"
            }`}
        >
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <GlassAvatar label={userInitial} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{userLabel}</p> 
              <p className="truncate text-xs text-zinc-500">{user?.email || "Free plan"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* Floating toggle button                                           */}
      {/* ---------------------------------------------------------------- */}
      <button
        type="button"
        onClick={() => setDrawerOpen((current) => !current)}
        aria-label={drawerOpen ? "Close chat navigation" : "Open chat navigation"}
        aria-expanded={drawerOpen}
        className={`fixed top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#0d0d0f] text-zinc-300 shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out hover:border-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 md:top-5 ${drawerOpen ? "left-4 opacity-0 pointer-events-none md:left-[300px] md:opacity-100 md:pointer-events-auto" : "left-4 rotate-0 md:pointer-events-none md:left-[86px] md:opacity-0"
          }`}
      >
        <MenuIcon open={drawerOpen} />
      </button>

      {/* ---------------------------------------------------------------- */}
      {/* Main content — offset by the permanent rail on md+ only          */}
      {/* ---------------------------------------------------------------- */}
      <div className="fixed inset-0 flex flex-col md:pl-[72px]">
        <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-20 flex-shrink-0 relative bg-[#0a0a0b]/80 px-5 py-4 backdrop-blur-xl lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="truncate pl-14 text-base font-medium text-white md:pl-10">
                <InlineMarkdownText content={activeChat?.title} fallback="New conversation" />
              </h2>

              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                aria-label="Show app information"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors duration-150 hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <InfoIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-full h-6 bg-gradient-to-b from-[#0a0a0b] to-transparent" />
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="scrollbar-chat min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
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
                      <h3 className="text-2xl font-semibold text-white sm:text-3xl">Ask anything</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        Pick a chat from the sidebar or start a new one.
                      </p>
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
                            className={`flex max-w-[min(760px,88%)] flex-col ${isUserMessage ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`max-w-full rounded-2xl border px-4 py-3 ${isUserMessage
                                ? "border-white/[0.08] bg-white/[0.06] text-zinc-100"
                                : "border-transparent bg-transparent text-zinc-100"
                                }`}
                            >
                              {isUserMessage ? (
                                <p className="whitespace-pre-wrap text-sm leading-6 text-inherit">{message.content}</p>
                              ) : (
                                <MarkdownMessage content={message.content} />
                              )}
                            </div>

                            <div
                              className={`mt-1 flex min-h-8 items-center gap-1 text-[11px] text-zinc-500 opacity-100 transition-all duration-150 ease-in-out sm:opacity-0 sm:group-hover/message:opacity-100 sm:group-focus-within/message:opacity-100 ${isUserMessage ? "justify-end" : "justify-start"}`}
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
                    {sendingMessage ? (
                      <div className="flex justify-start">
                        <div className="min-h-[44px] max-w-[min(760px,88%)] rounded-2xl border border-transparent px-4 py-3 text-zinc-100">
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
              <div className="relative bottom-0 left-0 right-0 z-20 flex flex-shrink-0 justify-center px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
                <form onSubmit={handleSendMessage} className="w-full max-w-lg rounded-2xl  p-3">
                  <div className="flex items-center gap-2 bg-black px-3 py-2.5 rounded-2xl">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(event) => {
                        setInputValue(event.target.value)
                        resizeInputHeight()
                      }}
                      rows={1}
                      placeholder="Ask something or start a new chat..."
                      className="min-h-12 flex-1 resize-none overflow-hidden rounded-xl  bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 transition-colors duration-150 scrollbar-thumb-zinc-700 scrollbar-track-transparent scrollbar-thin"
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !inputValue.trim()}
                      aria-label="Send message"
                      className="flex h-9 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white text-black transition-all duration-150 ease-out hover:bg-zinc-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 disabled:active:scale-100"
                    >
                      <ArrowLeftIcon className="absolute h-4 w-4 rotate-180" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>

      {infoOpen ? (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-black/60 px-4 backdrop-blur-md"
          onClick={() => setInfoOpen(false)}
          aria-hidden="true"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-info-title"
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0d0f] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-600">About this app</p>
                <h3 id="app-info-title" className="mt-1 text-2xl font-semibold text-white">
                  Project Perplexity
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                aria-label="Close app information"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors duration-150 hover:border-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
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
                <p className="mt-1 text-sm text-zinc-500">
                  Built for the Project Perplexity workspace.
                </p>
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
          </div>
        </div>
      ) : null}

      {pendingDeleteChat ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-md">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-chat-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d0f] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-600">Confirm deletion</p>
                <h3 id="delete-chat-title" className="mt-1 text-xl font-semibold text-white">
                  Are you sure you want to delete it?
                </h3>
              </div>
            </div>

            <p className="text-sm leading-6 text-zinc-500">
              This will permanently remove{" "}
              <span className="text-zinc-300">
                <InlineMarkdownText content={pendingDeleteChat.title} fallback="this chat" />
              </span>{" "}
              and its messages.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelDeleteChat}
                disabled={Boolean(deletingChatId)}
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-zinc-200 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.07] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteChat}
                disabled={Boolean(deletingChatId)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-rose-500 px-5 text-sm font-semibold text-white transition-all duration-150 hover:bg-rose-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/50"
              >
                {deletingChatId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editingChatId ? (
        <div className="fixed inset-0 z-[72] flex items-center justify-center bg-black/60 px-4 backdrop-blur-md" onClick={closeEditChatTitle}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-chat-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d0f] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-600">Edit chat title</p>
                <h3 id="edit-chat-title" className="mt-1 text-xl font-semibold text-white">
                  Rename this conversation
                </h3>
              </div>
            </div>

            <form onSubmit={saveChatTitle} className="space-y-4">
              <div>
                <label htmlFor="chat-title-input" className="mb-2 block text-sm text-zinc-400">
                  New chat title
                </label>
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

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default Dashboard
