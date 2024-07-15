import Login from "./components/login"

const AuthConfig = {
  type: "ams-manager",
  props: {
    showHeaders: false,
    className: 'h-full'
  },
  wrappers: [
    "ams-redux",
    "ams-router"
  ],
  children: [
    { type: Login,
      wrappers: ["ams-login"]
    },
    { type: "ams-reset-password" },
    { type: "ams-logout",
    // @props.redirectTo
    // Optional prop. Defaults to "/".
    // Redirects user to URL after logging out.
    // props: { redirectTo: "/" }
    },

    { type: "ams-signup",
    // @props.addToGroup
    // Optional prop. Defaults to false.
    // Adds user to group (must have auth level 0 in all projects) instead of creating a request that must be accepted by admin.
      props: { addToGroup: "123" }
    },
    { type: "ams-profile" },
    { type: "ams-verify-request" }, // This is only required when addToGroup prop is included with ams-signup
    { type: "ams-verify-email" }, // This is only required when addToGroup prop is not included with ams-signup
    { type: "ams-set-password" }, // This is only required when addToGroup prop is not included with ams-signup
    { type: "ams-accept-invite" },

    { type: "ams-project-management",
    // @props.authLevel
    // Optional prop. This prop can be applied to any AMS child.
    // If set, users must have equal or higher authLevel to view this page.
      props: { authLevel: 5 }
    }
  ]
}

export default {
  path: "/auth",
  mainNav: false,
  sideNav: {
    size: 'none'
  },
  component: AuthConfig
}
