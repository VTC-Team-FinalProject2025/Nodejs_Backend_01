import express from "express";
import { CookieKeys } from "../constants";
const Cookie = {
    setCookie: (key: string, value: string, response: express.Response, options = {
        httpOnly: true,
        maxAge: 15 * 60 * 1000,
    }) => {
        response.cookie(key, value, {
            sameSite: "lax",
            path: "/",
            secure: process.env.NODE_ENV === "production",
            ...options
        });
    },
    clearCookie: (key: string, response: express.Response) => {
        response.clearCookie(key, {
            httpOnly: true,
            domain: process.env.NODE_ENV === "production" ? ".duckdns.org" : undefined,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
        });
    },
    clearAllCookies: (response: express.Response) => {
        Object.values(CookieKeys).forEach((key) => {
            Cookie.clearCookie(key, response);
        });
    }
}
export default Cookie;