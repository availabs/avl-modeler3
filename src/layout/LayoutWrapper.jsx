import React, {useLayoutEffect} from 'react';
import { useNavigate,useLocation } from "react-router-dom";
import { withAuth } from '../modules/ams/src'
import get from 'lodash/get'
import cloneDeep from 'lodash/cloneDeep'
import checkAuth from './checkAuth'

const Wrapper = ({children}) => {
  const location = useLocation();
  useLayoutEffect(() => {
    document.documentElement.scrollTo(0, 0);
  }, [location.pathname]);
  return children
}

const LayoutWrapper = withAuth(({ 
  element: Element, 
  component: Comp, 
  Layout=({children}) => <>{children}</>, 
  ...props
}) => {

  const Child = Element || Comp // support old react router routes
    const navigate = useNavigate();
    const location = useLocation();

    const { auth, authLevel, user } = props;

    React.useEffect(() => {
      checkAuth({ auth, authLevel, user }, navigate, location);
    }, [auth, authLevel, navigate, location]);
  

  // console.log('LayoutWrapper props', props)
  // console.log('LayoutWrapper comp',  typeof Comp, Comp )
  // console.log('LayoutWrapper Element',  typeof Element, Element )
  //console.log('LayoutWrapper child', props, typeof Child, Child )
  // console.log('LayoutWrapper layout', typeof Layout, Layout)
  // -------------------------------------
  // we may want to restore this ??
  // -------------------------------------
  // if(authLevel > -1 && props?.user?.isAuthenticating) {
  //   return <Layout {...props}>Loading</Layout>
  // }
 
  return (
    <Wrapper>
      <Layout {...props}>
        <Child />
      </Layout>
    </Wrapper>
  )
})

export default function  DefaultLayoutWrapper ( routes, layout ) {
  //console.log('routes', routes)
  const menus = routes.filter(r => r.mainNav)
  return routes.map(route => {
    let out = cloneDeep(route)
    out.element = <LayoutWrapper {...out} Layout={layout} menus={menus} />
    return out
  })
}




