import express from "express";
import { CookieKeys } from "../constants";
const Cookie = {
    setCookie: (key: string, value: string, response: express.Response, options = {
        httpOnly: true,
        maxAge: 15 * 60 * 1000,
    }) => {
        response.cookie(key, value, {
            sameSite: 'none',
            path: "/",
            secure: process.env.NODE_ENV === "production",
            domain: process.env.NODE_ENV === "production" ? process.env.URL_CLIENT.split("//")[1] : undefined,
            ...options
        });
    },
    clearCookie: (key: string, response: express.Response) => {
        response.clearCookie(key, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            domain: process.env.NODE_ENV === "production" ? process.env.URL_CLIENT.split("//")[1] : undefined,
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