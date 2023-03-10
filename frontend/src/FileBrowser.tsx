import { useEffect, useState } from "react"
import { create } from "zustand"
import { download, exec, FileInfo, ls, selectUploadFile } from "./api/api"
import { useLogStore } from "./api/log.store"
import { useInfoStore } from "./api/store"

type FileBrowserState = {
  files: FileInfo[]
  setFiles: (files: FileInfo[]) => void
}

const useFileBrowserStore = create<FileBrowserState>((set) => ({
  files: [],
  setFiles: (files) => set({ files }),
}))

export default function FileBrowser() {
  const { setFiles } = useFileBrowserStore()
  const { cwd } = useInfoStore()
  const { log } = useLogStore()

  function reload() {
    ls(cwd).then((response) => {
      if (response.success) {
        // order by name

        setFiles(
          response.files.sort((a, b) => {
            if (a.name < b.name) return -1
            if (a.name > b.name) return 1
            return 0
          })
        )
      }
    })
  }

  useEffect(reload, [cwd])

  async function upload() {
    await selectUploadFile(log, reload)
  }

  return (
    <div className="text-sm md:text-base font-mono h-full flex flex-col p-2 md:p-4 pt-0 md:pt-0">
      <div className="flex flex-row items-baseline">
        <Path />
        <button className="hover:underline" onClick={upload}>
          Upload
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <FileList />
      </div>
    </div>
  )
}

function FileList() {
  const { files } = useFileBrowserStore()
  return (
    <table>
      <thead>
        <tr>
          <th className="text-start pr-8">Mode</th>
          <th className="text-start pr-8">Name</th>
          <th className="text-start pr-8">Size</th>
          <th className="text-start pr-8">Last Modified</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {files.map((file) => (
          <FileEntry key={file.name} file={file} />
        ))}
      </tbody>
    </table>
  )
}

function FileEntry({ file }: { file: FileInfo }) {
  const { setCwd, cwd } = useInfoStore()
  async function cd() {
    const response = await exec(`cd ${file.name}`)
    const newCwd = response.cwd
    setCwd(newCwd)
    if (!response.success) {
      console.log("error")
      return
    }
  }

  return (
    <tr
      onClick={file.isDir ? cd : undefined}
      className={`${
        file.isDir ? "cursor-pointer group transition hover:bg-neutral-800" : ""
      }`}
    >
      <td className="pr-8 py-1">
        {file.isDir ? "d" : "-"}
        {file.mode}
      </td>
      <td className="pr-8 py-1 group-hover:underline ">{file.name}</td>
      <td className="pr-8 py-1 text-neutral-400">{file.size}</td>
      <td className="pr-8 py-1 text-neutral-400">
        {new Date(file.lastModified * 1000).toISOString()}
      </td>
      {file.isDir ? (
        <td></td>
      ) : (
        <td
          onClick={async () => await download(file.name)}
          className="py-1 text-neutral-500 text-xs hover:underline cursor-pointer"
        >
          Download
        </td>
      )}
    </tr>
  )
}

function Path() {
  const { cwd, setCwd } = useInfoStore()
  const [localCwd, setLocalCwd] = useState(cwd)

  useEffect(() => {
    setLocalCwd(cwd)
  }, [cwd])

  async function onSubmit(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return
    const target = e.target as any
    let path = target.value + ""
    target.value = ""
    if (path === "") {
      path = "/"
    }

    const response = await exec(`cd ${path}`)
    const newCwd = response.cwd
    setCwd(newCwd)
    if (!response.success) {
      console.log("error")
      return
    }
  }

  return (
    <input
      className="bg-transparent focus:ring-0 py-2 flex-1"
      type="text"
      value={localCwd}
      onKeyDown={onSubmit}
      onChange={(e) => setLocalCwd(e.target.value)}
    />
  )
}
