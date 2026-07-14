import {createSlice} from '@reduxjs/toolkit' 
// createSlice is a function from Redux Toolkit that simplifies the process of creating a slice of the Redux state. It automatically generates action creators and action types based on the reducers we define. In this case, we are creating an auth slice to manage the authentication state of the application. The createSlice function takes an object with three properties: name, initialState, and reducers. The name property is a string that identifies the slice, the initialState property is an object that defines the initial state of the slice, and the reducers property is an object that contains functions to handle different actions and update the state accordingly.

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        accessToken: null,
        loading: true,
        error: null,
    },
    reducers: {
        setUser(state, action) {
            state.user = action.payload
        },
        setAccessToken(state, action) {
            state.accessToken = action.payload
        },
        setLoading(state, action) {
            state.loading = action.payload
        },
        setError(state, action) {
            state.error = action.payload
        }
    }
});

export const {setUser, setAccessToken, setLoading, setError}= authSlice.actions
export default authSlice.reducer