import Cookies from "js-cookie";

const ACCESS_TOKEN = "access_token";
const REFRESH_TOKEN = "refresh_token";

export const authStorage = {
  setTokens(access: string, refresh: string) {
    Cookies.set(ACCESS_TOKEN, access, { expires: 1 / 48 }); // 30 min
    Cookies.set(REFRESH_TOKEN, refresh, { expires: 7 });
  },
  getAccessToken: () => Cookies.get(ACCESS_TOKEN),
  getRefreshToken: () => Cookies.get(REFRESH_TOKEN),
  clear() {
    Cookies.remove(ACCESS_TOKEN);
    Cookies.remove(REFRESH_TOKEN);
  },
  isAuthenticated: () => !!Cookies.get(ACCESS_TOKEN),
};