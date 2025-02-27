import { useLocation } from "react-router-dom";

export const useNavigation = () => {
  const location = useLocation();

  const getPageName = (pathname: string) => {
    switch (pathname) {
      case "/story":
        return "Story Mode";
      case "/":
      default:
        return "TTS Generator";
    }
  };

  const currentPageName = getPageName(location.pathname);

  return { currentPageName };
};
