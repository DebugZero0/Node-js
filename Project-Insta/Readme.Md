Authentication
    ==> Register
    ==> Login
    ==> Logout
    ==> [OTP based authentication]

post
    ==> Create Post
    ==> View Post
    ==> like Post
    ==> save post
    ==> Edit Post
    ==> Delete Post

Monolithic Architecture with cloud integration
    ==> All features are tightly coupled and run as a single application.
    ==> Easier to develop and deploy initially, but can become complex and difficult to maintain as the application grows.
    ==> Cloud integration allows for scalability and flexibility, but may require additional configuration and management.

FrontEnd Architecture (4 layered architecture)

    =>UI layer: Handles user interface and user experience. It is responsible for rendering the visual elements of the application and managing user interactions.

    =>Hook layer: Manages the state and logic of the application. It handles data fetching, state management, and business logic.

    =>state layer: Responsible for managing the application's state. It stores and updates the data that is used across different components of the application.

    =>Api layer: Responsible for making API calls to the backend server. It handles communication between the frontend and backend, sending requests and receiving responses.
