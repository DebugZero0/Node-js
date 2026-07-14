import {configureStore} from '@reduxjs/toolkit' // To create the Redux store
import authReducer from '../features/auth/auth.slice.js' // 

export const store = configureStore({
    reducer: {
        auth: authReducer,
    },
})

// What are reducers? Reducers are pure functions that take the current state and an action as arguments and return a new state. They specify how the application's state changes in response to actions sent to the store. In this case, we have an authReducer that manages the authentication state of the application. By combining reducers, we can manage different parts of the application's state in a modular way.