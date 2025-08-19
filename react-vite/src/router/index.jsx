import { createBrowserRouter } from 'react-router-dom';
import { Home } from '../pages/Home';
import { Profile } from '../pages/Profile';
import { PinDetail } from '../pages/PinDetail';
import { BoardDetail } from '../pages/BoardDetail';
import { Boards } from '../pages/Boards';
import { LikedPins } from '../pages/LikedPins';
import UserPins from '../pages/UserPins';
import LoginFormPage from '../components/LoginFormPage';
import SignupFormPage from '../components/SignupFormPage';
import Layout from './Layout';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/explore",
        element: <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Explore Page</h1>
          <p>Coming soon...</p>
        </div>,
      },
      {
        path: "/create",
        element: <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Create Pin</h1>
          <p>Coming soon...</p>
        </div>,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/user/:userId",
        element: <Profile />,
      },
      {
        path: "/my-pins",
        element: <UserPins />,
      },
      {
        path: "/boards",
        element: <Boards />,
      },
      {
        path: "/liked",
        element: <LikedPins />,
      },
      {
        path: "/pin/:pinId",
        element: <PinDetail />,
      },
      {
        path: "/board/:boardId",
        element: <BoardDetail />,
      },
      {
        path: "login",
        element: <LoginFormPage />,
      },
      {
        path: "signup",
        element: <SignupFormPage />,
      },
    ],
  },
]);