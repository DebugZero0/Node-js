import { useDispatch, useSelector } from "react-redux"
import { initializeSocketConnection } from "../service/chat.socket"
import { updateUserName as updateUserNameRequest } from "../service/user.api"
import { deleteUser as deleteUserRequest } from "../service/user.api"
import { setUser } from "../../auth/auth.slice.js" // adjust path to match your actual auth.slice location

export const useUser = () => {
  const dispatch = useDispatch()
  const currentUser = useSelector((state) => state.auth.user)

  async function updateUserName(newName) {
    const data = await updateUserNameRequest(newName)
    // Backend doesn't return the updated user object properly, so patch optimistically
    dispatch(setUser({ ...currentUser, username: newName }))
    return data
  }
  async function deleteUser() {
    const data = await deleteUserRequest()
    // Clear user from state and disconnect socket
    dispatch(setUser(null))
    if (window.socket) {
      window.socket.disconnect()
    }
  }


  return {
    updateUserName,
    deleteUser
  }
}