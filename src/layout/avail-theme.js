const ppdaf = () => {

  // const bg = 'gray-50'
  const primary =  'nuetral'
  const highlight =  'white'
  const accent =  'blue'
  // const secondary =  'green'

  return {
    graphColors: [ '#1e40af','#93c5fd','#1d4ed8','#bfdbfe',],
    graphCategorical:  ['#fde72f','#95d840','#55a488','#2f708e','#453781','#472354'],
    sidenav: (opts={}) =>  {
        let {color = 'white', size = 'compact',  subMenuStyle = 'inline', responsive = 'top'} = opts
          
          let mobile = {
            top : 'hidden md:block',
            side: 'hidden md:block',
            none: ''
          }
          let colors = {
            white: {
              contentBg: `bg-${highlight} border-r`,
              sideItemActive:``,
              contentBgAccent: `bg-neutral-100`,
              accentColor: `${accent}-600`,
              accentBg: ``,
              borderColor: `border-slate-200`,
              textColor: `text-${primary}-600`,
              textColorAccent: `text-slate-800`,
              highlightColor: `text-blue-800`,
            },
            transparent: {
              contentBg: ``,
              contentBgAccent: `bg-neutral-100`,
              accentColor: `${accent}-600`,
              accentBg: `hover:bg-${accent}-400`,
              borderColor: `border-${primary}-100`,
              textColor: `text-${primary}-600`,
              textColorAccent: `text-slate-800`,
              highlightColor: `text-${primary}-800`,
            },
            dark: {
              contentBg: `bg-neutral-800`,
              contentBgAccent: `bg-neutral-900`,
              accentColor: `white`,
              accentBg: ``,
              borderColor: `border-neutral-700`,
              textColor: `text-slate-300`,
              textColorAccent: `text-slate-100`,
              highlightColor: `text-slate-100`,
              sideItem: 'text-slate-300 hover:text-white',
              sideItemActive: 'text-slate-300 hover:text-white'
            },
            bright: {
              contentBg: `bg-${accent}-700`,
              accentColor: `${accent}-400`,
              accentBg: `hover:bg-${accent}-400`,
              borderColor: `border-${accent}-600`,
              textColor: `text-${highlight}`,
              highlightColor: `text-${highlight}-500`,
            }
          }

      let sizes = {
        none: {
          wrapper: "w-0 overflow-hidden",
          sideItem: "flex mx-2 pr-4 py-2 text-base ",
          topItem: "flex items-center text-sm px-4 border-r h-12",
          icon: "mr-3 text-lg",
        },
        compact: {
          fixed: 'ml-0 md:ml-44',
          wrapper: "w-44",
          itemWrapper: 'pt-5',
          sideItem: "group flex px-3 py-1.5 text-[14px] font-light hover:bg-blue-50 text-slate-700 mx-2 ",
          sideItemActive: "group flex px-3 py-1.5 text-[14px] font-light hover:bg-blue-50 text-slate-700  mx-2 ", //"border-r-4 border-blue-500 ",
          topItem: "flex items-center text-sm px-4 border-r h-12",
          icon: "group w-6 mr-2 text-blue-500 ",
          iconActive: "group w-6 mr-2 text-blue-500 ",
          sideItemContent: 'group-hover:translate-x-1.5 transition-transform duration-300 ease-in-out',
        },
        full: {
          fixed: '',
          wrapper: "w-full",
          sideItem: "group flex px-3 py-2 text-[14px] font-light hover:bg-blue-50 text-slate-700 mx-2 border-r-4 border-white",
          sideItemActive: "group flex px-3 py-2 text-[14px] font-light hover:bg-blue-50 text-slate-700 mx-2 border-r-4  border-white",
          topItem: "flex pr-4 py-2  font-",
          icon: "group w-6 mr-2 text-blue-500  ",
          iconActive: "group w-6 mr-2 text-blue-500",
          sideItemContent: 'group-hover:translate-x-1.5 transition-transform duration-300 ease-in-out',
        },
        mini: {
          fixed: 'ml-0 md:ml-20',
          wrapper: "w-20 overflow-x-hidden",
          sideItem: "text-white hover:bg-blue-100 hover:text-blue-100",
          sideItemActive: "text-blue-500 bg-blue-500  ",
          topItem: "flex px-4 items-center text-sm font-light ",
          icon: "w-20 h-10 text-xl text-blue-500",
          iconActive: "w-20 h-10 text-xl text-white",
          sideItemContent: 'w-0',
        },
        micro: {
          fixed: 'ml-0 md:ml-14',
          wrapper: "w-14 overflow-x-hidden",
          itemWrapper: 'p-1',
          sideItem: "flex text-base font-base ",
          topItem: "flex mx-6 pr-4 py-2 text-sm font-light",
          icon: "w-12 text-2xl hover:bg-neutral-900 px-1 py-3 my-2 rounded-lg mr-4 hover:text-blue-500",
          sideItemContent: 'hidden',
        },

      }

      if(!sizes[size]) {
        //console.warn('invalid size', size)
        size='none'
      }
          

      let subMenuStyles = {
                inline: {
                    indicatorIcon: 'fa fa-angle-right pt-2.5',
                    indicatorIconOpen: 'fal fa-angle-down pt-2.5',
                    subMenuWrapper: `pl-2 w-full`,
                    subMenuParentWrapper: `flex flex-col w-full`
                },
                flyout: {
                    indicatorIcon: 'fal fa-angle-down',
                    indicatorIconOpen: 'fa fa-angle-right',
                    subMenuWrapper: `absolute ml-${sizes[size].width - 8}`,
                    subMenuParentWrapper: `flex flex-row`,
                    subMenuWrapperTop: `absolute top-full`,
                },
        }

        return {
        fixed: `md:${sizes[size].fixed}`,
        logoWrapper: `${sizes[size].wrapper} ${colors[color].contentBgAccent} ${colors[color].textColorAccent}`,
        sidenavWrapper: `${mobile[responsive]} ${colors[color].contentBg} ${sizes[size].wrapper} h-full z-20`,
        menuIconSide: `${sizes[size].icon} group-hover:${colors[color].highlightColor}`,
        menuIconSideActive: `${sizes[size].iconActive} group-hover:${colors[color].highlightColor}`,
        
        itemsWrapper: `${colors[color].borderColor} ${sizes[size].itemWrapper}  `,
        navItemContent: `${sizes[size].sideItemContent}`,
        navitemSide: `
            group  flex flex-col

            ${sizes[size].sideItem} ${colors[color].sideItem}
            focus:outline-none focus:text-gray-800 focus:bg-gray-50 focus:border-gray-300
            transition-all cursor-pointer
         `,
        navitemSideActive: `
            group  flex flex-col
             ${sizes[size].sideItemActive} ${colors[color].sideItemActive} 
            
            focus:outline-none focus:text-gray-800 focus:bg-gray-50 focus:border-gray-300
            transition-all cursor-pointer

          `,
          ...subMenuStyles[subMenuStyle],
          vars: {
            colors,
            sizes,
            mobile
          }
        }

    },


    /* -----
         Top Nav Theme Components Minimal
    ------*/
    topnav: ({
        color='white',
        size='compact',
        menu='left',
        subMenuStyle = 'inline',
    }) => {

      let colors = {
        white: {
          contentBg: `bg-slate-100`,
          accentColor: `${accent}-500`,
          accentBg: `hover:bg-white`,
          borderColor: `border-${primary}-100`,
          textColor: `text-slate-700`,
          highlightColor: `text-blue-500`,
        },
        bright: {
          contentBg: `bg-${accent}-700`,
          accentColor: `${accent}-400`,
          accentBg: `hover:bg-${accent}-400`,
          borderColor: `border-${accent}-600`,
          textColor: `text-${highlight}`,
          highlightColor: `text-${highlight}`,
        }
      }
      let sizes = {
        compact: {
          menu: `hidden uppercase md:flex flex-1 ${menu === 'left' ? '' : 'justify-end'} divide-x-2`,
          sideItem: "flex  mx-6 pr-4 py-2 text-sm font-light hover:pl-4",
          topItem: `flex font-medium tracking-widest items-center text-[14px] px-4 h-12 ${colors[color].textColor} ${colors[color].borderColor}
            ${colors[color].accentBg} hover:${colors[color].highlightColor}`,
          activeItem: `flex font-medium  tracking-widest bg-white items-center text-[14px] px-4 h-12 ${colors[color].highlightColor} ${colors[color].borderColor}
            ${colors[color].accentBg} hover:${colors[color].highlightColor}`,
          icon: "mr-3 text-lg",
          responsive: 'md:hidden'
        },
        inline: {
          menu: 'flex flex-1',
          sideItem: "flex mx-4 pr-4 py-4 text-base font-base border-b hover:pl-4",
          topItem: `flex px-4 py-2 mx-2 font-medium text-gray-400 border-b-2 ${colors[color].textColor} ${colors[color].borderColor}
          hover:border-gray-300 hover:text-gray-700 border-gray-100 `,
          activeItem: `flex px-4 py-2 mx-2 font-medium text-blue-600 border-b-2 ${colors[color].textColor} ${colors[color].borderColor} border-blue-600 `,
          icon: "mr-4 text-2xl",
          responsive: 'hidden'
        }

      }

        let subMenuStyles = {
            inline: {
                // indicatorIcon: 'fa fa-angle-right pt-2.5',
                // indicatorIconOpen: 'fal fa-angle-down pt-2.5',
                subMenuWrapperChild: ``,
                subMenuWrapper: `pl-2 w-full `,
                subMenuParentWrapper: `flex flex-col w-full  `
            },
            flyout: {
                indicatorIcon: 'fal fa-angle-down pl-2 pt-1',
                indicatorIconOpen: 'fal fa-angle-down pl-2',
                subMenuWrapper: `absolute ml-${sizes[size].width - 8} `,
                subMenuParentWrapper: `flex flex-row  `,
                subMenuWrapperTop: `absolute top-full  `,
            },
            row: {
                indicatorIcon: 'fal fa-angle-down pl-2 pt-1',
                indicatorIconOpen: 'fal fa-angle-down pl-2 pt-1',
                subMenuWrapper: `absolute bg-white ml-${sizes[size].width - 8}`,
                subMenuParentWrapper: `flex flex-row  `,
                subMenuWrapperChild: `divide-x overflow-x-auto`,
                subMenuWrapperTop: `absolute top-full left-0 border-y border-gray-200 w-full bg-white normal-case`,
                subMenuWrapperInactiveFlyout: `absolute  mt-8 normal-case bg-white shadow-lg z-10 p-2`,
                subMenuWrapperInactiveFlyoutBelow: ` absolute ml-40 normal-case bg-white shadow-lg z-10 p-2`,
                subMenuWrapperInactiveFlyoutDirection: 'flex flex-col divide-y-2'
            },
        }


        return {
        topnavWrapper: `w-full ${colors[color].contentBg} border-b border-gray-200`,
        topnavContent: `flex w-full h-full`,
        topnavMenu: `${sizes[size].menu} h-full overflow-x-auto overflow-y-hidden scrollbar-sm`,
        menuIconTop: `text-${colors[color].accentColor} ${sizes[size].icon} group-hover:${colors[color].highlightColor}`,
        menuIconTopActive : `text-${colors[color].accentColor} ${sizes[size].icon} group-hover:${colors[color].highlightColor}`,
        menuOpenIcon: `fa-light fa-bars fa-fw`,
        menuCloseIcon: `fa-light fa-xmark fa-fw"`,
        navitemTop: `
            w-fit group font-display whitespace-nowrap
            ${sizes[size].topItem}
            focus:outline-none focus:text-gray-800 focus:bg-gray-50 focus:border-gray-300
            transition cursor-pointer
        `,
        //`px-4 text-sm font-medium tracking-widest uppercase inline-flex items-center  border-transparent  leading-5 text-white hover:bg-white hover:text-darkblue-500 border-gray-200 focus:outline-none focus:text-gray-700 focus:border-gray-300 transition duration-150 ease-in-out h-full`,
        topmenuRightNavContainer: "hidden md:block h-full",
        topnavMobileContainer: "bg-slate-50",
        navitemTopActive:
          ` w-fit group font-display whitespace-nowrap
            ${sizes[size].activeItem}
            focus:outline-none focus:text-gray-800 focus:bg-gray-50 focus:border-gray-300
            transition cursor-pointer 
          `,
        mobileButton:`${sizes[size].responsive} ${colors[color].contentBg} inline-flex items-center justify-center pt-[12px] px-2 hover:text-blue-400  text-gray-400 hover:bg-gray-100 `,
        ...subMenuStyles[subMenuStyle],
        vars: {
          colors,
          sizes
        }
      }

    },

    select: (opts={}) => {
      const { color = 'white' } = opts
      let colors = {
        white: 'white',
        transparent: 'gray-100 border border-gray-200 shadow-sm'
      }
      return {
        menuWrapper: `bg-${colors[color]} my-1`,
        menuItemActive: `px-4 py-2 cursor-not-allowed bg-${accent}-200 border-1 focus:border-${accent}-300`,
        menuItem: `px-4 py-2 cursor-pointer hover:bg-blue-100 border-1 border-${colors[color]} focus:border-blue-300`,
        select: `bg-${colors[color]} w-full flex flex-row flex-wrap justify-between px-4 py-2 cursor-pointer focus:border-blue-300`,
        selectIcon: `fal fa-angle-down text-gray-400 pt-2`
      }
    },

    table: (opts = {color:'white', size: 'compact'}) => {
          const {color = 'white', size = 'compact'} = opts
          let colors = {
              white: 'bg-white hover:bg-blue-50',
              gray: 'bg-gray-100 hover:bg-gray-200',
              transparent: 'gray-100'
          }

          let sizes = {
              small: 'px-4 py-1 text-xs',
              compact: 'px-4 py-1 text-sm',
              full: 'px-10 py-5'
          }
          return {
              tableHeader:
                  `${sizes[size]} pb-1 h-8 border border-b-4 border-gray-200 bg-slate-50 text-left font-semibold text-gray-700 uppercase first:rounded-tl-md last:rounded-tr-md`,
              tableInfoBar: "bg-white",
              tableRow: `${colors[color]} transition ease-in-out duration-150 hover:bg-blue-100`,
              tableOpenOutRow: 'flex flex-col',
              tableRowStriped: `bg-white odd:bg-blue-50 hover:bg-blue-100 bg-opacity-25 transition ease-in-out duration-150`,
              tableCell: `${sizes[size]} break-words border border-gray-200 pl-1 align-top font-light text-sm`,
              inputSmall: 'w-24',
              sortIconDown: 'fas fa-sort-amount-down text-tigGray-300 opacity-75',
              sortIconUp: 'fas fa-sort-amount-up text-tigGray-300 opacity-75',
              sortIconIdeal: 'fa fa-sort-alt text-tigGray-300 opacity-25',
              infoIcon: 'fas fa-info text-sm text-blue-300 hover:text-blue-500',
              vars: {
                  color: colors,
                  size: sizes
              }
          }
         
      },

    tabpanel: (opts = {}) => {
            const { tabLocation = 'top' } = opts

             let tabLocations = {
                top:  {
                        tabpanelWrapper: 'flex-col',
                        tabWrapper: 'flex-row',
                        tab: `border-b-2`
                },
                left:  {
                        tabpanelWrapper: 'flex-row',
                        tabWrapper: 'flex-col',
                        tab: `border-r-2`
                }
            }
            return {
                tabpanelWrapper: `flex ${tabLocations[tabLocation].tabpanelWrapper} w-full h-full`,
                tabWrapper: `flex ${tabLocations[tabLocation].tabWrapper}`,
                tab: `px-4 py-2 hover:text-gray-800 cursor-pointer   text-center text-gray-500`,
                tabActive: `px-4 py-2 text-${accent}-500 ${tabLocations[tabLocation].tab} border-blue-500 text-center`,
                icon: '',
                tabName: '',
                contentWrapper: 'bg-white flex-1 h-full',
                vars: {
                    tabLocation: tabLocations
                }
            }
        },
        button: (opts = {}) => {
            const {color = 'white', size = 'base', width = 'block'} = opts
            let colors = {
                white: `
                    border border-gray-300  text-gray-700 bg-white hover:text-gray-500
                    focus:outline-none focus:shadow-outline-blue focus:border-blue-300
                    active:text-gray-800 active:bg-gray-50 transition duration-150 ease-in-out
                    disabled:cursor-not-allowed
                `,
                cancel: `
                    text-red-700 bg-white hover:text-red-500
                    focus:outline-none focus:shadow-outline-blue focus:border-blue-300
                    active:text-red-800 active:bg-gray-50 transition duration-150 ease-in-out
                    disabled:cursor-not-allowed
                `,
                transparent: `
                    border border-gray-300  text-gray-700 bg-white hover:text-gray-500
                    focus:outline-none focus:shadow-outline-blue focus:border-blue-300
                    active:text-gray-800 active:bg-gray-50 hover:bg-gray-100 hover:text-gray-900
                    transition duration-150 ease-in-out
                    disabled:cursor-not-allowed
                `,
                primary: `
                    border border-transparent shadow
                    text-sm leading-4 text-white bg-blue-600 hover:bg-blue-700
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`,
                danger: ''
            }

            let sizes  = {
                base: 'px-4 py-4 leading-5 font-medium',
                xs: 'text-xs px-1 py-0.5 leading-5 font-thin rounded-sm',
                sm: 'text-sm px-2 py-2 leading-5 font-medium rounded-md',
                lg: 'text-lg px-6 py-6 leading-5 font-medium rounded-md',
                xl: 'text-2xl px-12 py-8 leading-5 font-medium rounded-lg'
            }

            let widths = {
                'block': '',
                'full' : 'w-full'
            }

            return {
                button: `
                  ${colors[color]} ${sizes[size]} ${widths[width]}
                `,
                vars: {
                    color: colors,
                    size: sizes,
                    width: widths
                }
            }
        },
        input: (opts = {}) => {
            const {color = 'white', size = 'small', width = 'block'} = opts
            let colors = {
                white: 'bg-white focus:outline-none',
                gray: 'bg-gray-100'
            }

            let sizes  = {
                base: 'px-4 py-4 font-medium',
                small: 'text-sm px-2 py-2 font-medium text-xs',
                large: 'text-lg px-6 py-6 font-medium text-xl'
            }

            let widths = {
                'block': '',
                'full' : 'w-full'
            }

            return {
                input: `
                 ${colors[color]} ${sizes[size]} ${widths[width]}
                `,
                vars: {
                    color: colors,
                    size: sizes,
                    width: widths
                }
            }
        },
        modal: (opts = {}) => {
            const {size = 'base', overlay = 'default'} = opts
            let overlays = {
                default: 'fixed  inset-0 bg-gray-500 opacity-75',
                none: ''
            }

            let sizes = {
                base: 'sm:max-w-2xl',
                small: 'w-64',
                large: 'sm:max-w-5xl',
                xlarge: 'sm:max-w-8xl'

            }

            return {
                modalContainer: `${overlay === 'default' ? '' : 'pointer-events-none'} fixed bottom-0 inset-x-0 px-4 pb-4 inset-0 flex items-center justify-center z-50`,
                modalOverlay: overlays[overlay],
                modal: `${sizes[size]} w-full  pointer-events-auto bg-white rounded-lg overflow-hidden shadow-xl transform transition-all`,
                vars: {
                    size: sizes,
                    overlay: overlays
                }
            }
        },



    /* ------------------------- */
    shadow: "shadow",
    ySpace: "py-4",
    text: "text-gray-800",
    textContrast: "text-white",
    border: "broder-gray-400",

    textInfo: "text-blue-400",
    bgInfo: "bg-blue-400",
    borderInfo: "border-blue-400",

    textSuccess: "text-blue-400",
    bgSuccess: "bg-blue-400",
    borderSuccess: "border-blue-400",

    textDanger: "text-red-400",
    bgDanger: "bg-red-400",
    borderDanger: "border-red-400",

    textWarning: "text-yellow-400",
    bgWarning: "bg-yellow-400",
    borderWarning: "border-yellow-400",

    textLight: "text-gray-400", // <-- for text styled like placeholder but can't be selected with ::placeholder
    placeholder: "placeholder-gray-400",

    topMenuBorder: "border-b border-gray-200",
    topMenuScroll: "",
    headerShadow: "",
    navText: "text-gray-100",

    navMenu: "h-full relative",
    navMenuOpen: "bg-darkblue-500 text-white shadow-lg w-56 rounded-t-lg",
    navMenuBg: "bg-darkblue-500 bb-rounded-10 shadow-lg text-white rounded-b-lg",
    navMenuItem:
      "hover:font-medium cursor-pointer px-2 py-1 text-lg font-semibold",

    bg: "bg-gray-50",

    menuBg: "bg-white z-50",
    menuBgHover: "",
    menuBgActive: "bg-blue-200",
    menuBgActiveHover: "hover:bg-blue-300",
    menuText: "text-gray-100",
    menuTextHover: "hover:text-gray-700",
    menuTextActive: "text-blue-500",
    menuTextActiveHover: "hover:text-blue-700",

    headerBg: "bg-gray-200",
    headerBgHover: "hover:bg-gray-400",

    inputBg: "bg-white disabled:bg-gray-200 cursor-pointer focus:outline-none",
    inputBorder:
      "rounded border-0 border-transparent hover:border-gray-300 focus:border-gray-600 disabled:border-gray-200",
    inputBgDisabled: "bg-gray-200 cursor-not-allowed focus:outline-none",
    inputBorderDisabled: "rounded border-2 border-gray-200 hover:border-gray-200",
    inputBgFocus: "bg-white cursor-pointer focus:outline-none",
    inputBorderFocus:
      "rounded border-2 border-transparent hover:border-gray-600 focus:border-gray-600 border-gray-600",

    textBase: "text-base",
    textSmall: "text-sm",
    textLarge: "text-lg",
    paddingBase: "py-1 px-2",
    paddingSmall: "py-0 px-1",
    paddingLarge: "py-2 px-4",

    contentBg: "bg-white",

    accent1: "bg-blue-100",
    accent2: "bg-gray-300",
    accent3: "bg-gray-400",
    accent4: "bg-gray-500",

    highlight1: "bg-blue-200",
    highlight2: "bg-blue-300",
    highlight3: "bg-blue-400",
    highlight4: "bg-blue-500",

    width: "",

    transition: "transition ease-in-out duration-150",

    tableRow: "bg-gray-100 hover:bg-gray-200 transition ease-in-out duration-150",
    tableRowStriped:
      "bg-gray-100 even:bg-gray-200 hover:bg-gray-300 transition ease-in-out duration-150",

    tableCell: "px-4 py-1 whitespace-no-wrap",

    tableHeader:
      "px-4 py-2 pb-1 border-b-2 border-gray-300 bg-gray-200 text-left font-medium text-gray-700 uppercase first:rounded-tl-md last:rounded-tr-md",
  }
};

const PPDAF_THEME = ppdaf();
export default PPDAF_THEME
