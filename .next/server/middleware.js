"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "middleware";
exports.ids = ["middleware"];
exports.modules = {

/***/ "(middleware)/./middleware.js":
/*!***********************!*\
  !*** ./middleware.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   config: () => (/* binding */ config),\n/* harmony export */   middleware: () => (/* binding */ middleware),\n/* harmony export */   runtime: () => (/* binding */ runtime)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(middleware)/./node_modules/next/dist/api/server.js\");\n\nconst runtime = 'nodejs';\nasync function middleware(request) {\n    const { pathname } = request.nextUrl;\n    const publicPaths = [\n        '/',\n        '/login',\n        '/register',\n        '/api/auth/login',\n        '/api/auth/register',\n        '/api/auth/verify-code',\n        '/api/news',\n        '/api/news/schedule/status',\n        '/api/analyze/status',\n        '/api/analyze/stats',\n        '/api/asset-classes',\n        '/_next',\n        '/favicon.ico'\n    ];\n    if (publicPaths.some((path)=>pathname === path || pathname.startsWith('/_next'))) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.next();\n    }\n    // 从 Authorization header 或 cookie 中获取 token\n    let token = request.headers.get('authorization')?.replace('Bearer ', '');\n    if (!token) {\n        const cookie = request.headers.get('cookie');\n        if (cookie) {\n            const tokenMatch = cookie.match(/token=([^;]+)/);\n            if (tokenMatch) token = tokenMatch[1];\n        }\n    }\n    if (!token) {\n        if (pathname.startsWith('/api/') && !publicPaths.includes(pathname)) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                detail: '请先登录'\n            }, {\n                status: 401\n            });\n        }\n        if (!pathname.startsWith('/api/') && pathname !== '/' && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.redirect(new URL('/login', request.url));\n        }\n    }\n    if (token) {\n        const { verifyToken } = await __webpack_require__.e(/*! import() */ \"_middleware_lib_auth_js\").then(__webpack_require__.bind(__webpack_require__, /*! ./lib/auth */ \"(middleware)/./lib/auth.js\"));\n        const payload = await verifyToken(token);\n        if (!payload) {\n            if (pathname.startsWith('/api/')) {\n                return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                    detail: '登录已过期，请重新登录'\n                }, {\n                    status: 401\n                });\n            }\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.redirect(new URL('/login', request.url));\n        }\n        const requestHeaders = new Headers(request.headers);\n        requestHeaders.set('x-user-id', payload.id.toString());\n        requestHeaders.set('x-user-email', payload.email);\n        requestHeaders.set('x-user-role', payload.role);\n        // HTTP 头必须是 ASCII，中文等非 ASCII 用 base64 编码\n        const rawName = payload.username ?? '';\n        const usernameHeader = /[\\u0080-\\uFFFF]/.test(rawName) ? Buffer.from(rawName, 'utf-8').toString('base64') : rawName;\n        requestHeaders.set('x-user-username', usernameHeader);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.next({\n            request: {\n                headers: requestHeaders\n            }\n        });\n    }\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.next();\n}\nconst config = {\n    matcher: [\n        '/((?!api/auth/me|_next/static|_next/image|favicon.ico).*)'\n    ]\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gJ25leHQvc2VydmVyJ1xuXG5leHBvcnQgY29uc3QgcnVudGltZSA9ICdub2RlanMnXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWRkbGV3YXJlKHJlcXVlc3QpIHtcbiAgY29uc3QgeyBwYXRobmFtZSB9ID0gcmVxdWVzdC5uZXh0VXJsXG5cbiAgY29uc3QgcHVibGljUGF0aHMgPSBbXG4gICAgJy8nLFxuICAgICcvbG9naW4nLFxuICAgICcvcmVnaXN0ZXInLFxuICAgICcvYXBpL2F1dGgvbG9naW4nLFxuICAgICcvYXBpL2F1dGgvcmVnaXN0ZXInLFxuICAgICcvYXBpL2F1dGgvdmVyaWZ5LWNvZGUnLFxuICAgICcvYXBpL25ld3MnLFxuICAgICcvYXBpL25ld3Mvc2NoZWR1bGUvc3RhdHVzJyxcbiAgICAnL2FwaS9hbmFseXplL3N0YXR1cycsXG4gICAgJy9hcGkvYW5hbHl6ZS9zdGF0cycsXG4gICAgJy9hcGkvYXNzZXQtY2xhc3NlcycsXG4gICAgJy9fbmV4dCcsXG4gICAgJy9mYXZpY29uLmljbydcbiAgXVxuXG4gIGlmIChwdWJsaWNQYXRocy5zb21lKHBhdGggPT4gcGF0aG5hbWUgPT09IHBhdGggfHwgcGF0aG5hbWUuc3RhcnRzV2l0aCgnL19uZXh0JykpKSB7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5uZXh0KClcbiAgfVxuXG4gIC8vIOS7jiBBdXRob3JpemF0aW9uIGhlYWRlciDmiJYgY29va2llIOS4reiOt+WPliB0b2tlblxuICBsZXQgdG9rZW4gPSByZXF1ZXN0LmhlYWRlcnMuZ2V0KCdhdXRob3JpemF0aW9uJyk/LnJlcGxhY2UoJ0JlYXJlciAnLCAnJylcbiAgaWYgKCF0b2tlbikge1xuICAgIGNvbnN0IGNvb2tpZSA9IHJlcXVlc3QuaGVhZGVycy5nZXQoJ2Nvb2tpZScpXG4gICAgaWYgKGNvb2tpZSkge1xuICAgICAgY29uc3QgdG9rZW5NYXRjaCA9IGNvb2tpZS5tYXRjaCgvdG9rZW49KFteO10rKS8pXG4gICAgICBpZiAodG9rZW5NYXRjaCkgdG9rZW4gPSB0b2tlbk1hdGNoWzFdXG4gICAgfVxuICB9XG5cbiAgaWYgKCF0b2tlbikge1xuICAgIGlmIChwYXRobmFtZS5zdGFydHNXaXRoKCcvYXBpLycpICYmICFwdWJsaWNQYXRocy5pbmNsdWRlcyhwYXRobmFtZSkpIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGRldGFpbDogJ+ivt+WFiOeZu+W9lScgfSwgeyBzdGF0dXM6IDQwMSB9KVxuICAgIH1cbiAgICBpZiAoIXBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9hcGkvJykgJiYgcGF0aG5hbWUgIT09ICcvJyAmJiAhcGF0aG5hbWUuc3RhcnRzV2l0aCgnL2xvZ2luJykgJiYgIXBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9yZWdpc3RlcicpKSB7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLnJlZGlyZWN0KG5ldyBVUkwoJy9sb2dpbicsIHJlcXVlc3QudXJsKSlcbiAgICB9XG4gIH1cblxuICBpZiAodG9rZW4pIHtcbiAgICBjb25zdCB7IHZlcmlmeVRva2VuIH0gPSBhd2FpdCBpbXBvcnQoJy4vbGliL2F1dGgnKVxuICAgIGNvbnN0IHBheWxvYWQgPSBhd2FpdCB2ZXJpZnlUb2tlbih0b2tlbilcbiAgICBpZiAoIXBheWxvYWQpIHtcbiAgICAgIGlmIChwYXRobmFtZS5zdGFydHNXaXRoKCcvYXBpLycpKSB7XG4gICAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGRldGFpbDogJ+eZu+W9leW3sui/h+acn++8jOivt+mHjeaWsOeZu+W9lScgfSwgeyBzdGF0dXM6IDQwMSB9KVxuICAgICAgfVxuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5yZWRpcmVjdChuZXcgVVJMKCcvbG9naW4nLCByZXF1ZXN0LnVybCkpXG4gICAgfVxuXG4gICAgY29uc3QgcmVxdWVzdEhlYWRlcnMgPSBuZXcgSGVhZGVycyhyZXF1ZXN0LmhlYWRlcnMpXG4gICAgcmVxdWVzdEhlYWRlcnMuc2V0KCd4LXVzZXItaWQnLCBwYXlsb2FkLmlkLnRvU3RyaW5nKCkpXG4gICAgcmVxdWVzdEhlYWRlcnMuc2V0KCd4LXVzZXItZW1haWwnLCBwYXlsb2FkLmVtYWlsKVxuICAgIHJlcXVlc3RIZWFkZXJzLnNldCgneC11c2VyLXJvbGUnLCBwYXlsb2FkLnJvbGUpXG4gICAgLy8gSFRUUCDlpLTlv4XpobvmmK8gQVNDSUnvvIzkuK3mlofnrYnpnZ4gQVNDSUkg55SoIGJhc2U2NCDnvJbnoIFcbiAgICBjb25zdCByYXdOYW1lID0gcGF5bG9hZC51c2VybmFtZSA/PyAnJ1xuICAgIGNvbnN0IHVzZXJuYW1lSGVhZGVyID0gL1tcXHUwMDgwLVxcdUZGRkZdLy50ZXN0KHJhd05hbWUpXG4gICAgICA/IEJ1ZmZlci5mcm9tKHJhd05hbWUsICd1dGYtOCcpLnRvU3RyaW5nKCdiYXNlNjQnKVxuICAgICAgOiByYXdOYW1lXG4gICAgcmVxdWVzdEhlYWRlcnMuc2V0KCd4LXVzZXItdXNlcm5hbWUnLCB1c2VybmFtZUhlYWRlcilcblxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UubmV4dCh7XG4gICAgICByZXF1ZXN0OiB7XG4gICAgICAgIGhlYWRlcnM6IHJlcXVlc3RIZWFkZXJzXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiBOZXh0UmVzcG9uc2UubmV4dCgpXG59XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSB7XG4gIG1hdGNoZXI6IFtcbiAgICAnLygoPyFhcGkvYXV0aC9tZXxfbmV4dC9zdGF0aWN8X25leHQvaW1hZ2V8ZmF2aWNvbi5pY28pLiopJ1xuICBdXG59XG4iXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwicnVudGltZSIsIm1pZGRsZXdhcmUiLCJyZXF1ZXN0IiwicGF0aG5hbWUiLCJuZXh0VXJsIiwicHVibGljUGF0aHMiLCJzb21lIiwicGF0aCIsInN0YXJ0c1dpdGgiLCJuZXh0IiwidG9rZW4iLCJoZWFkZXJzIiwiZ2V0IiwicmVwbGFjZSIsImNvb2tpZSIsInRva2VuTWF0Y2giLCJtYXRjaCIsImluY2x1ZGVzIiwianNvbiIsImRldGFpbCIsInN0YXR1cyIsInJlZGlyZWN0IiwiVVJMIiwidXJsIiwidmVyaWZ5VG9rZW4iLCJwYXlsb2FkIiwicmVxdWVzdEhlYWRlcnMiLCJIZWFkZXJzIiwic2V0IiwiaWQiLCJ0b1N0cmluZyIsImVtYWlsIiwicm9sZSIsInJhd05hbWUiLCJ1c2VybmFtZSIsInVzZXJuYW1lSGVhZGVyIiwidGVzdCIsIkJ1ZmZlciIsImZyb20iLCJjb25maWciLCJtYXRjaGVyIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(middleware)/./middleware.js\n");

/***/ }),

/***/ "(middleware)/./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=D%3A%5C%E6%8A%95%E8%B5%84%E6%A8%A1%E5%9E%8B%5Cfunds-next%5Cmiddleware.js&page=%2Fmiddleware&rootDir=D%3A%5C%E6%8A%95%E8%B5%84%E6%A8%A1%E5%9E%8B%5Cfunds-next&matchers=&preferredRegion=&middlewareConfig=e30%3D!":
/*!******************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=D%3A%5C%E6%8A%95%E8%B5%84%E6%A8%A1%E5%9E%8B%5Cfunds-next%5Cmiddleware.js&page=%2Fmiddleware&rootDir=D%3A%5C%E6%8A%95%E8%B5%84%E6%A8%A1%E5%9E%8B%5Cfunds-next&matchers=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \******************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ nHandler)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_web_globals__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/web/globals */ \"(middleware)/./node_modules/next/dist/server/web/globals.js\");\n/* harmony import */ var next_dist_server_web_globals__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_web_globals__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_web_adapter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/web/adapter */ \"(middleware)/./node_modules/next/dist/server/web/adapter.js\");\n/* harmony import */ var next_dist_server_web_adapter__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_web_adapter__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _middleware_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./middleware.js */ \"(middleware)/./middleware.js\");\n/* harmony import */ var next_dist_client_components_is_next_router_error__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! next/dist/client/components/is-next-router-error */ \"(middleware)/./node_modules/next/dist/client/components/is-next-router-error.js\");\n/* harmony import */ var next_dist_client_components_is_next_router_error__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_dist_client_components_is_next_router_error__WEBPACK_IMPORTED_MODULE_3__);\n\n\n// Import the userland code.\n\n\n\nconst mod = {\n    ..._middleware_js__WEBPACK_IMPORTED_MODULE_2__\n};\nconst handler = mod.middleware || mod.default;\nconst page = \"/middleware\";\nif (typeof handler !== 'function') {\n    throw Object.defineProperty(new Error(`The Middleware \"${page}\" must export a \\`middleware\\` or a \\`default\\` function`), \"__NEXT_ERROR_CODE\", {\n        value: \"E120\",\n        enumerable: false,\n        configurable: true\n    });\n}\n// Middleware will only sent out the FetchEvent to next server,\n// so load instrumentation module here and track the error inside middleware module.\nfunction errorHandledHandler(fn) {\n    return async (...args)=>{\n        try {\n            return await fn(...args);\n        } catch (err) {\n            // In development, error the navigation API usage in runtime,\n            // since it's not allowed to be used in middleware as it's outside of react component tree.\n            if (true) {\n                if ((0,next_dist_client_components_is_next_router_error__WEBPACK_IMPORTED_MODULE_3__.isNextRouterError)(err)) {\n                    err.message = `Next.js navigation API is not allowed to be used in Middleware.`;\n                    throw err;\n                }\n            }\n            const req = args[0];\n            const url = new URL(req.url);\n            const resource = url.pathname + url.search;\n            await (0,next_dist_server_web_globals__WEBPACK_IMPORTED_MODULE_0__.edgeInstrumentationOnRequestError)(err, {\n                path: resource,\n                method: req.method,\n                headers: Object.fromEntries(req.headers.entries())\n            }, {\n                routerKind: 'Pages Router',\n                routePath: '/middleware',\n                routeType: 'middleware',\n                revalidateReason: undefined\n            });\n            throw err;\n        }\n    };\n}\nfunction nHandler(opts) {\n    return (0,next_dist_server_web_adapter__WEBPACK_IMPORTED_MODULE_1__.adapter)({\n        ...opts,\n        page,\n        handler: errorHandledHandler(handler)\n    });\n}\n\n//# sourceMappingURL=middleware.js.map\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vbm9kZV9tb2R1bGVzL25leHQvZGlzdC9idWlsZC93ZWJwYWNrL2xvYWRlcnMvbmV4dC1taWRkbGV3YXJlLWxvYWRlci5qcz9hYnNvbHV0ZVBhZ2VQYXRoPUQlM0ElNUMlRTYlOEElOTUlRTglQjUlODQlRTYlQTglQTElRTUlOUUlOEIlNUNmdW5kcy1uZXh0JTVDbWlkZGxld2FyZS5qcyZwYWdlPSUyRm1pZGRsZXdhcmUmcm9vdERpcj1EJTNBJTVDJUU2JThBJTk1JUU4JUI1JTg0JUU2JUE4JUExJUU1JTlFJThCJTVDZnVuZHMtbmV4dCZtYXRjaGVycz0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBc0M7QUFDaUI7QUFDdkQ7QUFDd0M7QUFDeUM7QUFDSTtBQUNyRjtBQUNBLE9BQU8sMkNBQUk7QUFDWDtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZEQUE2RCxLQUFLO0FBQ2xFO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsZ0JBQWdCLElBQXFDO0FBQ3JELG9CQUFvQixtR0FBaUI7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0IsK0ZBQWlDO0FBQ25EO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNlO0FBQ2YsV0FBVyxxRUFBTztBQUNsQjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUEiLCJzb3VyY2VzIjpbIiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXCJuZXh0L2Rpc3Qvc2VydmVyL3dlYi9nbG9iYWxzXCI7XG5pbXBvcnQgeyBhZGFwdGVyIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvd2ViL2FkYXB0ZXJcIjtcbi8vIEltcG9ydCB0aGUgdXNlcmxhbmQgY29kZS5cbmltcG9ydCAqIGFzIF9tb2QgZnJvbSBcIi4vbWlkZGxld2FyZS5qc1wiO1xuaW1wb3J0IHsgZWRnZUluc3RydW1lbnRhdGlvbk9uUmVxdWVzdEVycm9yIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvd2ViL2dsb2JhbHNcIjtcbmltcG9ydCB7IGlzTmV4dFJvdXRlckVycm9yIH0gZnJvbSBcIm5leHQvZGlzdC9jbGllbnQvY29tcG9uZW50cy9pcy1uZXh0LXJvdXRlci1lcnJvclwiO1xuY29uc3QgbW9kID0ge1xuICAgIC4uLl9tb2Rcbn07XG5jb25zdCBoYW5kbGVyID0gbW9kLm1pZGRsZXdhcmUgfHwgbW9kLmRlZmF1bHQ7XG5jb25zdCBwYWdlID0gXCIvbWlkZGxld2FyZVwiO1xuaWYgKHR5cGVvZiBoYW5kbGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgT2JqZWN0LmRlZmluZVByb3BlcnR5KG5ldyBFcnJvcihgVGhlIE1pZGRsZXdhcmUgXCIke3BhZ2V9XCIgbXVzdCBleHBvcnQgYSBcXGBtaWRkbGV3YXJlXFxgIG9yIGEgXFxgZGVmYXVsdFxcYCBmdW5jdGlvbmApLCBcIl9fTkVYVF9FUlJPUl9DT0RFXCIsIHtcbiAgICAgICAgdmFsdWU6IFwiRTEyMFwiLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG59XG4vLyBNaWRkbGV3YXJlIHdpbGwgb25seSBzZW50IG91dCB0aGUgRmV0Y2hFdmVudCB0byBuZXh0IHNlcnZlcixcbi8vIHNvIGxvYWQgaW5zdHJ1bWVudGF0aW9uIG1vZHVsZSBoZXJlIGFuZCB0cmFjayB0aGUgZXJyb3IgaW5zaWRlIG1pZGRsZXdhcmUgbW9kdWxlLlxuZnVuY3Rpb24gZXJyb3JIYW5kbGVkSGFuZGxlcihmbikge1xuICAgIHJldHVybiBhc3luYyAoLi4uYXJncyk9PntcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBmbiguLi5hcmdzKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAvLyBJbiBkZXZlbG9wbWVudCwgZXJyb3IgdGhlIG5hdmlnYXRpb24gQVBJIHVzYWdlIGluIHJ1bnRpbWUsXG4gICAgICAgICAgICAvLyBzaW5jZSBpdCdzIG5vdCBhbGxvd2VkIHRvIGJlIHVzZWQgaW4gbWlkZGxld2FyZSBhcyBpdCdzIG91dHNpZGUgb2YgcmVhY3QgY29tcG9uZW50IHRyZWUuXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgICAgICAgIGlmIChpc05leHRSb3V0ZXJFcnJvcihlcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGVyci5tZXNzYWdlID0gYE5leHQuanMgbmF2aWdhdGlvbiBBUEkgaXMgbm90IGFsbG93ZWQgdG8gYmUgdXNlZCBpbiBNaWRkbGV3YXJlLmA7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZXEgPSBhcmdzWzBdO1xuICAgICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc291cmNlID0gdXJsLnBhdGhuYW1lICsgdXJsLnNlYXJjaDtcbiAgICAgICAgICAgIGF3YWl0IGVkZ2VJbnN0cnVtZW50YXRpb25PblJlcXVlc3RFcnJvcihlcnIsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiByZXNvdXJjZSxcbiAgICAgICAgICAgICAgICBtZXRob2Q6IHJlcS5tZXRob2QsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogT2JqZWN0LmZyb21FbnRyaWVzKHJlcS5oZWFkZXJzLmVudHJpZXMoKSlcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICByb3V0ZXJLaW5kOiAnUGFnZXMgUm91dGVyJyxcbiAgICAgICAgICAgICAgICByb3V0ZVBhdGg6ICcvbWlkZGxld2FyZScsXG4gICAgICAgICAgICAgICAgcm91dGVUeXBlOiAnbWlkZGxld2FyZScsXG4gICAgICAgICAgICAgICAgcmV2YWxpZGF0ZVJlYXNvbjogdW5kZWZpbmVkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgIH07XG59XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBuSGFuZGxlcihvcHRzKSB7XG4gICAgcmV0dXJuIGFkYXB0ZXIoe1xuICAgICAgICAuLi5vcHRzLFxuICAgICAgICBwYWdlLFxuICAgICAgICBoYW5kbGVyOiBlcnJvckhhbmRsZWRIYW5kbGVyKGhhbmRsZXIpXG4gICAgfSk7XG59XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1pZGRsZXdhcmUuanMubWFwXG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(middleware)/./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=D%3A%5C%E6%8A%95%E8%B5%84%E6%A8%A1%E5%9E%8B%5Cfunds-next%5Cmiddleware.js&page=%2Fmiddleware&rootDir=D%3A%5C%E6%8A%95%E8%B5%84%E6%A8%A1%E5%9E%8B%5Cfunds-next&matchers=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "../app-render/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/server/app-render/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/app-render/action-async-storage.external.js");

/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "../lib/cache-handlers/default.external":
/*!**************************************************************************!*\
  !*** external "next/dist/server/lib/cache-handlers/default.external.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/lib/cache-handlers/default.external.js");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "node:async_hooks":
/*!***********************************!*\
  !*** external "node:async_hooks" ***!
  \***********************************/
/***/ ((module) => {

module.exports = require("node:async_hooks");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("./webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next"], () => (__webpack_exec__("(middleware)/./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=D%3A%5C%E6%8A%95%E8%B5%84%E6%A8%A1%E5%9E%8B%5Cfunds-next%5Cmiddleware.js&page=%2Fmiddleware&rootDir=D%3A%5C%E6%8A%95%E8%B5%84%E6%A8%A1%E5%9E%8B%5Cfunds-next&matchers=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();