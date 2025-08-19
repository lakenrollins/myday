import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ModalProvider, Modal } from "../context/Modal";
import { SearchProvider, useSearch } from "../context/SearchContext";
import { thunkAuthenticate } from "../redux/session";
import { Header } from "../components/Layout/Header";

function LayoutContent() {
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);
  const user = useSelector(state => state.session.user);
  const { performSearch } = useSearch();

  useEffect(() => {
    dispatch(thunkAuthenticate()).then(() => setIsLoaded(true));
  }, [dispatch]);

  return (
    <>
      <ModalProvider>
        <Header user={user} onSearch={performSearch} />
        {isLoaded && <Outlet />}
        <Modal />
      </ModalProvider>
    </>
  );
}

export default function Layout() {
  return (
    <SearchProvider>
      <LayoutContent />
    </SearchProvider>
  );
}
