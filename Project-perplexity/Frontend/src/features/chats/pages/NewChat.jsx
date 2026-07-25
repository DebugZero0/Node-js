import React from 'react'
import { ArrowLeftIcon ,SparklesIcon} from '@heroicons/react/24/outline'
import { Mic, MicOff } from 'lucide-react'
import { CloseIcon, PaperclipIcon } from '../components/IconFunction'

const NewChat = ({
    formRef,
    dockedInputRef,
    attachmentInputRef,
    inputValue,
    setInputValue,
    sendingMessage,
    pendingAttachments,
    handleSendMessage,
    handleFilesSelected,
    removeAttachment,
    triggerAttachmentPicker,
    resizeInputHeight,
    isListening,
    toggleListening,
}) => {
    return (
        <div className="flex min-h-[50vh] w-full items-center justify-center px-3 sm:min-h-[55vh] sm:px-4">
            <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-2 text-center lg:max-w-3xl">
              <div className="flex items-center gap-5 text-zinc-400">
                <SparklesIcon className="h-5 w-5" />
                <h3 className="text-2xl font-semibold text-white sm:text-3xl lg:text-3xl">Ask anything</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Pick a chat from the sidebar or start a new one.
                </p>
                <div className="relative flex-col w-full justify-center px-0 py-3 backdrop-blur-xl sm:pt-2 sm:pb-4">
                            <form onSubmit={handleSendMessage} ref={formRef} className="w-full max-w-full p-0 sm:max-w-2xl sm:p-1 lg:max-w-3xl flex flex-col items-center">
                              {pendingAttachments.length > 0 && (
                                <div className="mb-2 flex w-full flex-wrap justify-start gap-2 px-1 sm:w-[65%] lg:w-[73%]">
                                  {pendingAttachments.map((attachment) => (
                                    <div
                                      key={attachment.id}
                                      className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs ${
                                        attachment.status === "error"
                                          ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                                          : attachment.status === "unsupported"
                                          ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                                          : "border-white/10 bg-white/[0.05] text-zinc-200"
                                      }`}
                                    >
                                      {attachment.kind === "image" && attachment.previewUrl ? (
                                        <img src={attachment.previewUrl} alt={attachment.name} className="h-5 w-5 rounded object-cover" />
                                      ) : (
                                        <PaperclipIcon className="h-3.5 w-3.5 shrink-0" />
                                      )}
                                      <span className="max-w-[9rem] truncate">{attachment.name}</span>
                                      {attachment.status === "uploading" && (
                                        <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-zinc-500/40 border-t-zinc-200" />
                                      )}
                                      {attachment.status === "unsupported" && <span className="shrink-0">unsupported</span>}
                                      {attachment.status === "error" && <span className="shrink-0">failed</span>}
                                      <button
                                        type="button"
                                        onClick={() => removeAttachment(attachment.id)}
                                        aria-label={`Remove ${attachment.name}`}
                                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:text-white"
                                      >
                                        <CloseIcon className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            {/* whole div  */}
                              <div className="flex flex-col items-center gap-2 rounded-2xl  bg-[#131316] px-1 py-3 sm:px-3 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),inset_0_0_0_1px_rgba(255,255,255,0.02),0_1px_2px_rgba(0,0,0,0.4),0_8px_24px_-8px_rgba(0,0,0,0.6)] backdrop-blur-md ring-1 ring-black/40 transition-shadow duration-200 w-full sm:w-[65%] lg:w-[73%]">
                                  {/* Textarea */}
                                  <div className=" w-full">
                                      <textarea
                                        ref={dockedInputRef}
                                        value={inputValue}
                                        onChange={(event) => {
                                          setInputValue(event.target.value)
                                          // resizeInputHeight()
                                        }}
                                        onKeyDown={(event) => {
                                          if (
                                            event.key === "Enter" &&
                                            !event.shiftKey &&
                                            !sendingMessage &&
                                            inputValue.trim()
                                          ) {
                                            event.preventDefault()
                                            formRef.current?.requestSubmit()
                                          }
                                        }}
                                        placeholder="Write a message..."
                                        // 1) textarea className
                                        className="box-border h-8 min-h-8 max-h-[160px] w-full resize-none rounded-xl bg-transparent px-3 pt-3 pb-0 text-sm leading-5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none sm:text-base scrollbar-thin scrollbar-thumb-zinc-500/30 scrollbar-track-transparent transition-[height] ease-in-out duration-[250ms]"
                                      />
                                  </div>
                                {/* icons and buttons */}
                                <div className="flex w-full items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 w-full">
                                      <input
                                        ref={attachmentInputRef}
                                        type="file"
                                        multiple
                                        hidden
                                        accept="image/*,.txt,.md,.js,.jsx,.ts,.tsx,.json,.py,.css,.html,.csv,.pdf,.log,.yml,.yaml"
                                        onChange={handleFilesSelected}
                                      />
                                    
                                      <button
                                        type="button"
                                        onClick={triggerAttachmentPicker}
                                        aria-label="Attach files"
                                        title="Attach files"
                                        className={`relative flex h-9 w-10 flex-shrink-0 items-center justify-center rounded-full text-zinc-400 transition-all duration-150 ease-out hover:text-zinc-100 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:w-11`} 
                                      >
                                        <PaperclipIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                    {/* Mic + Send */}
                                    <div className="flex items-center justify-end gap-2 w-full">
                                      <button
                                        type="button"
                                        onClick={toggleListening}
                                        aria-label={isListening ? "Stop recording" : "Start voice input"}
                                        className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-150 ease-out active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:w-8 ${
                                          isListening ? "bg-red-500 text-white animate-pulse" : "bg-transparent text-zinc-200 hover:text-zinc-100"
                                        }`}
                                      >
                                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={sendingMessage || !inputValue.trim()}
                                        aria-label="Send message"
                                        className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white text-black transition-all duration-150 ease-out hover:bg-zinc-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 disabled:active:scale-100"
                                      >
                                        <ArrowLeftIcon className="h-4 w-4 rotate-90" />
                                      </button>
                                    </div>
                                </div>
                              </div>
                            </form>
                </div>
            </div>
        </div>
    )
}

export default NewChat