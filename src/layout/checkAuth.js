import get from 'lodash/get'
const checkAuth = (props,navigate) => {
  //const isAuthenticating = props?.user?.isAuthenticating
  
  //------------------------------------------
  // TODO : if user is logged in 
  // and refreshes authed page
  // isAuthenticating = false and Authed = false 
  // so user is sent to login
  // while token check happens in background
  // then user is send back to authed page
  // by /auth/login redirect using state:from
  // can we switch to isAuthenticating is true
  //------------------------------------------

  let reqAuthLevel = get(props, "authLevel", -1);
  const authReq = get(props, "auth", false);
  reqAuthLevel = Math.max(reqAuthLevel, authReq ? 0 : -1);

  const userAuthed = get(props, ["user", "authed"], false);
  const userAuthLevel = get(props, ["user", "authLevel"], -1);

  const sendToLogin = !userAuthed && (reqAuthLevel >= 0);
  const sendToHome = userAuthLevel < reqAuthLevel;

  // const authLevel = props.auth ? 0 : (props?.authLevel || -1); 
  // const sendToLogin = authLevel > -1 && !get(props, ["user", "authed"], false)
  // const sendToHome = (get(props , ["user", "authLevel"], -1) < authLevel);
 // console.log('lw login:', sendToLogin, 'home:',sendToHome, props.path)
  
  //----------------------------------------
  // if page requires auth
  // && user isn't logged in
  // send to login 
  //----------------------------------------
  if( sendToLogin ) {
    //console.log('navigate to login', nav)
    navigate("/auth/login", {state:{ from: props.path }})
    // return <Navigate 
    //   to={ "/auth/login" } 
    //   state={{ from: props.path }}
    // />
  } 
  //----------------------------------------
  // if page requires auth level
  // && user is below that
  // send to home
  //----------------------------------------
  else if (sendToHome) {
    navigate('/')
    //return <Navigate to='/' />
  }

  return false
}

export default checkAuth