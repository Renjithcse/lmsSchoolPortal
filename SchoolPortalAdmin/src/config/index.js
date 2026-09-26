export const env = "live"

const url = {
  dev: "http://13.127.227.196/SchoolErp/public/api/",
  dev_vercel: "https://schoolbackend-two.vercel.app/api/",
  local: "http://localhost:3001/api/",
  live: "/api/"
}

// const url = {
//   dev: "/api/",
//   dev_vercel: "/api/",
//   local: "/api/",
//   live: "/api/"
// }

const basePath = {
  local: "http://localhost:3001/",
  live: "/"
}

// const basePath = {
//   local: "/",
//   live: "/"
// }

// const IMAGE = {
//   dev: 'https://apild.diginestsolutions.in/public',

// }

export const BASE_URL = `${url[env]}`

export const BASE_PATH = `${basePath[env]}`

