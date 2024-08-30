export const PROJECT_NAME = "avail_modeler";

export const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYW0zMDgxIiwiYSI6IkxzS0FpU0UifQ.rYv6mHCcNd7KKMs7yhY3rw";

let API_HOST = "https://graph.availabs.org";
let AUTH_HOST = "https://availauth.availabs.org";
let CLIENT_HOST = "https://ppdaf.org";
let DAMA_HOST = "https://graph.availabs.org";

if (process.env.NODE_ENV === "development") {
  // API_HOST = "http://localhost:4444";
  // AUTH_HOST = 'http://localhost:3457';
  // DAMA_HOST = "http://localhost:4444"
  CLIENT_HOST = "http://localhost:3000";
}
export { API_HOST, AUTH_HOST, CLIENT_HOST, DAMA_HOST };


