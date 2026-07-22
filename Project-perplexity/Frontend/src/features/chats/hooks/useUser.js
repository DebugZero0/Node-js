import { useDispatch, useSelector } from "react-redux"
import { initializeSocketConnection } from "../service/chat.socket"
import { updateUserName as updateUserNameRequest } from "../service/user.api"
import { deleteUser as deleteUserRequest } from "../service/user.api"
import { getQuota as getQuotaRequest } from "../service/user.api"
import { setUser } from "../../auth/auth.slice.js"

export const useUser = () => {
  const dispatch = useDispatch()
  const currentUser = useSelector((state) => state.auth.user)

  async function updateUserName(newName) {
    const data = await updateUserNameRequest(newName)
    dispatch(setUser({ ...currentUser, username: newName }))
    return data
  }
  async function deleteUser() {
    const data = await deleteUserRequest()
    dispatch(setUser(null))
    if (window.socket) {
      window.socket.disconnect()
    }
  }
  async function getQuota() {
    return await getQuotaRequest()
  }

  return {
    updateUserName,
    deleteUser,
    getQuota,
  }
}