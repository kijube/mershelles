import { useRef } from "react"
import { create } from "zustand"
import { exec } from "./api/api"
import { useCurrentCommandStore } from "./api/current-command.store"
import { useLogStore } from "./api/log.store"
import { useInfoStore } from "./api/store"
import Log from "./Log"

export default function Shell() {
  const { username, hostname, cwd } = useInfoStore()
  const { isExecuting, execute, done, currentCommand } =
    useCurrentCommandStore()
  const { clear, log } = useLogStore()
  const logRef = useRef<HTMLDivElement>(null)

  function interceptCommand(command: string) {
    command = command.trim()
    if (command === "clear") {
      clear()
      return true
    } else if (command === "") {
      log({ type: "output", output: "" })
      return true
    }
    return false
  }

  async function onSubmit(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return
    const target = e.target as any
    const command = target.value + ""
    target.value = ""
    execute(command)

    if (interceptCommand(command)) {
      done()
      return
    }

    const response = await exec(command)
    log({ type: "input", command })
    if (response.success) {
      response.output
        .split("\n")
        .forEach((line) => log({ type: "output", output: line }))
      if (response.output.length === 0) {
        log({ type: "output", output: "No output." })
      }
    } else {
      log({ type: "error", error: response.error })
    }
    done()
  }

  return (
    <div className="bg-neutral-900 rounded-xl shadow-2xl flex-1 flex flex-col font-mono">
      <div ref={logRef} className="flex-1 overflow-auto p-4">
        <Log parentRef={logRef} />
      </div>
      <div className="border-t border-t-neutral-700 flex flex-row items-baseline pl-4 bg-neutral-800 rounded-bl-xl">
        <div className="rounded-bl-xl text-sm">
          {username}@{hostname}
        </div>
        <div className="mx-4 font-bold text-sm">{cwd}</div>
        <input
          disabled={isExecuting}
          onKeyDown={onSubmit}
          type="text"
          className="w-full p-4 rounded-br-xl bg-neutral-900"
          placeholder={
            isExecuting ? `Executing ${currentCommand} ...` : "Enter command"
          }
        ></input>
      </div>
    </div>
  )
}
