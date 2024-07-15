import { rgb2hex, toHex, categoricalColors } from '../../LayerManager/utils'
import ckmeans, {equalIntervalBreaks, jenksBreaks, prettyBreaks} from '../../../../../../../../../pages/DataManager/utils/ckmeans'


export function categoryPaint(column, categoryData, colors, num=10, showOther='#ccc') {
  let paint = ['match',
      ['to-string',['get', column]],
  ]
  Array.from(Array(+num).keys()).forEach((d,i) => {
    let cat = ''+categoryData?.[i]?.[column]
      if(cat && cat != '[object Object]'){
        paint.push(''+categoryData?.[i]?.[column])
        paint.push(toHex(colors[i % colors.length]))
      }
  })
  paint.push(showOther)

  const legend  = (paint || []).filter((d,i) => i > 2 )
      .map((d,i) => {
        if(i%2 === 0) {
          return {color: d, label: paint[i+2]}
        }
        return null
      })
      .filter(d => d)

  return {paint, legend}
}

export function isValidCategoryPaint(paint) {
  let valid = typeof paint === 'object' && Array.isArray(paint)
  if(!valid) {
    return valid
  }
  paint.forEach(cat => {
    if(!cat || cat === 'undefined') {
      valid = false
    }
  }) 
  return valid
}

let methods = {
  'ckmeans': ckmeans,
  'equalInterval': equalIntervalBreaks, 
  'jenks': ckmeans,//jenksBreaks, 
  'pretty': prettyBreaks
}

let round = (n, p = 2) => (e => Math.round(n * e) / e)(Math.pow(10, p))

export function choroplethPaint( column, choroplethdata, colors, num=10, method='ckmeans' ) {
  //console.log('paint method', method)
  let paint = [
      'step',
      ['get', column],
     
      //'#51bbd6',
      // 100,
  ]
  // console.log('choroplethdata', choroplethdata)
  if(!Array.isArray(choroplethdata)) {
    return false
  }
  let domain = methods[method](choroplethdata, num).map(d => round(d,2))
  const max = Math.max(...choroplethdata)

  if(!Array.isArray(domain) || domain.length  === 0){
    return false
  }
  console.log('max', max)

  domain
   //.filter((d,i) => i < domain.length-1)
    .forEach((d,i) => {
    paint.push(colors[i]);
    paint.push(+d)
  })

  paint.push(colors[num-1])



  const legend = [
    ...(paint || []).filter((d,i) => i > 2 )
    .map((d,i) => {
      
      if(i % 2 === 1) {
        console.log('test', fnumIndex(paint[i+4] || max))
        return {color: paint[i+1], label: `${fnumIndex(paint[i+2])} - ${fnumIndex(paint[i+4] || max)}`}
      }
      return null
    })
    .filter(d => d)
  ]

  console.log('legend', legend)
  return { paint, legend }

  
;


  // let inerpaint = [
  //     'interpolate',
  //     ['linear'],
  //     [get, 'column'],
  //     // 274,
  //     // ['to-color', '#f5e5f3'],
  //     // 1551,
  //     // ['to-color', '#8d00ac']
  // ]


}

const fnumIndex = (d, fractions = 2, currency = false) => {
    if (d >= 1000000000000) {
      return `${currency ? '$' : ``} ${(d / 1000000000000).toFixed(fractions)} T`;
    } else if (d >= 1000000000) {
      return `${currency ? '$' : ``} ${(d / 1000000000).toFixed(fractions)} B`;
    } else if (d >= 1000000) {
      return `${currency ? '$' : ``} ${(d / 1000000).toFixed(fractions)} M`;
    } else if (d >= 1000) {
      return `${currency ? '$' : ``} ${(d / 1000).toFixed(fractions)} K`;
    } else {
      return typeof d === "object" ? `` : `${currency ? '$' : ``} ${parseInt(d)}`;
    }
  }