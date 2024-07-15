
const typeConfigs = {
  'fill': [
     {
      label: 'Type',
      type: 'inline',
      controls: [
        {
          type: 'selectType',
          params: {
            options: [
              {name:'Simple', value: 'simple'},
              {name:'Categories', value: 'categories'},
              {name:'Color Range', value: 'choropleth'}
            ]
          },
          path: `['layer-type']`,
          datapath: `layers[1].paint['fill-color']`
        }
      ]
    },
    {
      label: 'Color By',
      type: 'inline',
      conditional: {
        path: `['layer-type']`,
        conditions: ['categories', 'choropleth']
      },
      controls: [
        {
          type: 'selectViewColumn',
          params: {
            options: [
              {name:'Column Select', value: 'simple'},
              
            ]
          },
          path: `['data-column']`
        }
      ]
    },
    {
      label: 'Categories',
      type: 'popover',
      conditional: {
        path: `['layer-type']`,
        conditions: ['categories']
      },
      controls: [
        {
          type: 'categoryControl',
          params: {
            options: [
              {name:'Column Select', value: 'simple'},
            ],
            format: (v) => `${((v?.length-3 || 0)/2) || '10'} Categories`
          },
          path: `layers[1].paint['fill-color']`
        }
      ]
    },
    {
      label: 'Fill',
      type: 'inline',
      conditional: {
        path: `['layer-type']`,
        conditions: ['categories']
      },
      controls: [
        {
          type: 'categoricalColor',
          path: `['color-set']`
        }
      ],
    },
    {
      label: 'Scale',
      type: 'popover',
      conditional: {
        path: `['layer-type']`,
        conditions: ['choropleth']
      },
      controls: [
        {
          type: 'choroplethControl',
          params: {
            format: (v) => `${((v?.length-3 || 0)/2) || '10'} Categories`
          },
          path: `layers[1].paint['fill-color']`
        }
      ]
    },
    {
      label: 'Fill',
      type: 'inline',
      conditional: {
        path: `['layer-type']`,
        conditions: ['choropleth']
      },
      controls: [
        {
          type: 'rangeColor',
          path: `['color-range']`
        }
      ],
    },
    {
      label: 'Fill',
      type: 'popover',
      conditional: {
        path: `['layer-type']`,
        conditions: ['simple']
      },
      controls: [
        {
          type: 'color',
          path: `layers[1].paint['fill-color']`
        }
      ]
    },
    {
      label: 'Stroke',
      type: 'popover',
      controls: [
        {
          type: 'color',
          path: `layers[0].paint['line-color']`
        },
        {
          type: 'range',
          unit: 'px',
          path: `layers[0].paint['line-width']`,
          params: {
            min: "0",
            max: "10",
            step: "0.5",
            default: "3",
            units: "px"
          }
        },
      ],
    },
    {
      label: 'Opacity',
      type: 'inline',
      controls: [
        {
          type: 'range',
          unit: '%',
          path: `layers[1].paint['fill-opacity']`,
          params: {
            min: "0",
            max: "1",
            step: "0.01",
            default: "0.75",
            units: "%",
            format: (v) => Math.round(v * 100)
          }
        },
      ],
    }
  ],
  'circle': [
    {
      label: 'Type',
      type: 'inline',
      controls: [
        {
          type: 'selectType',
          params: {
            options: [
              {name:'Simple', value: 'simple'},
              {name:'Categories', value: 'categories'},
              {name:'Color Range', value: 'choropleth'}
            ]
          },
          path: `['layer-type']`,
          datapath: `layers[0].paint['circle-color']`
        }
      ]
    },
    {
      label: 'Color By',
      type: 'inline',
      conditional: {
        path: `['layer-type']`,
        conditions: ['categories', 'choropleth']
      },
      controls: [
        {
          type: 'selectViewColumn',
          params: {
            options: [
              {name:'Column Select', value: 'simple'},
              
            ]
          },
          path: `['data-column']`,
          datapath: `['category-data']`
        }
      ]
    },
    {
      label: 'Categories',
      type: 'popover',
      conditional: {
        path: `['layer-type']`,
        conditions: ['categories']
      },
      controls: [
        {
          type: 'categoryControl',
          params: {
            options: [
              {name:'Column Select', value: 'simple'},
              
            ],
            format: (v) => `${((v?.length || 0)/2) || '10'} Categories`
          },
          path: `layers[0].paint['circle-color']`
        }
      ]
    },
    {
      label: 'Fill',
      type: 'inline',
      conditional: {
        path: `['layer-type']`,
        conditions: ['categories']
      },
      controls: [
        {
          type: 'categoricalColor',
          path: `['color-set']`
        }
      ],
    },
    {
      label: 'Scale',
      type: 'popover',
      conditional: {
        path: `['layer-type']`,
        conditions: ['choropleth']
      },
      controls: [
        {
          type: 'choroplethControl',
          params: {
            format: (v) => `${((v?.length-3 || 0)/2) || '10'} Categories`
          },
          path: `layers[1].paint['circle-color']`
        }
      ]
    },
    {
      label: 'Fill',
      type: 'inline',
      conditional: {
        path: `['layer-type']`,
        conditions: ['choropleth']
      },
      controls: [
        {
          type: 'rangeColor',
          path: `['color-range']`
        }
      ],
    },
    {
      label: 'Fill',
      type: 'popover',
      conditional: {
        path: `['layer-type']`,
        conditions: ['simple']
      },
      controls: [
        {
          type: 'color',
          path: `layers[0].paint['circle-color']`
        }
      ],
    },
    {
      label: 'Size',
      type: 'inline',
      controls: [
        {
          type: 'range',
          unit: '%',
          path: `layers[0].paint['circle-radius']`,
          params: {
            min: "0",
            max: "20",
            step: "0.5",
            default: "3",
            units: "px"
          }
        },
      ],
    },
    {
      label: 'Stroke',
      type: 'popover',
      controls: [
        {
          type: 'color',
          path: `layers[0].paint['circle-stroke-color']`
        },
        {
          type: 'range',
          unit: 'px',
          path: `layers[0].paint['circle-stroke-width']`,
          params: {
            min: "0",
            max: "20",
            step: "0.5",
            default: "3",
            units: "px"
          }
        },
      ],
    },
    {
      label: 'Opacity',
      type: 'inline',
      controls: [
        {
          type: 'range',
          unit: '%',
          path: `layers[0].paint['circle-opacity']`,
          params: {
            min: "0",
            max: "1",
            step: "0.01",
            default: "0.75",
            units: "%",
            format: (v) => Math.round(v * 100)
          }
        },
      ],
    }
  ],
  'line': [
    {
      label: 'Type',
      type: 'inline',
      controls: [
        {
          type: 'selectType',
          params: {
            options: [
              {name:'Simple', value: 'simple'},
              {name:'Categories', value: 'categories'},
              {name:'Color Range', value: 'choropleth'}
            ]
          },
          path: `['layer-type']`,
          datapath: `layers[1].paint['line-color']`
        }
      ]
    },
    {
      label: 'Color By',
      type: 'inline',
      conditional: {
        path: `['layer-type']`,
        conditions: ['categories', 'choropleth']
      },
      controls: [
        {
          type: 'selectViewColumn',
          params: {
            options: [
              {name:'Column Select', value: 'simple'},
              
            ]
          },
          path: `['data-column']`,
          datapath: `['category-data']`
        }
      ]
    },
    {
      label: 'Categories',
      type: 'popover',
      conditional: {
        path: `['layer-type']`,
        conditions: ['categories']
      },
      controls: [
        {
          type: 'categoryControl',
          params: {
            options: [
              {name:'Column Select', value: 'simple'},
              
            ],
            format: (v) => `${((v?.length-3 || 0)/2) || '10'} Categories`
          },
          path: `layers[1].paint['line-color']`
          // vars: {

          // }
        }
      ]
    },
    {
      label: 'Fill',
      type: 'inline',
      conditional: {
        path: `['layer-type']`,
        conditions: ['categories']
      },
      controls: [
        {
          type: 'categoricalColor',
          path: `['color-set']`
        }
      ],
    },
    {
      label: 'Scale',
      type: 'popover',
      conditional: {
        path: `['layer-type']`,
        conditions: ['choropleth']
      },
      controls: [
        {
          type: 'choroplethControl',
          params: {
            format: (v) => `${((v?.length-3 || 0)/2) || '10'} Categories`
          },
          path: `layers[1].paint['line-color']`
        }
      ]
    },
    {
      label: 'Fill',
      type: 'inline',
      conditional: {
        path: `['layer-type']`,
        conditions: ['choropleth']
      },
      controls: [
        {
          type: 'rangeColor',
          path: `['color-range']`
        }
      ],
    },
    {
      label: 'Fill',
      type: 'popover',
      conditional: {
        path: `['layer-type']`,
        conditions: ['simple']
      },
      controls: [
        {
          type: 'color',
          path: `layers[1].paint['line-color']`
        }
      ],
    },
    {
      label: 'Size',
      type: 'inline',
      controls: [
        {
          type: 'range',
          unit: '%',
          path: `layers[1].paint['line-width']`,
          params: {
            min: "0",
            max: "20",
            step: "0.5",
            default: "3",
            units: "px"
          }
        },
      ],
    },
    {
      label: 'Offset',
      type: 'inline',
      controls: [
        {
          type: 'range',
          unit: '%',
          path: `layers[1].paint['line-offset']`,
          params: {
            min: "-10",
            max: "10",
            step: "0.5",
            default: "0",
            units: "px"
          }
        },
      ],
    },
    {
      label: 'Casing',
      type: 'popover',
      controls: [
        {
          type: 'color',
          path: `layers[0].paint['line-color']`
        },
        {
          type: 'range',
          unit: 'px',
          path: `layers[0].paint['line-width']`,
          params: {
            min: "0",
            max: "20",
            step: "0.5",
            default: "3",
            units: "px"
          }
        },
        {
          type: 'range',
          unit: 'px',
          path: `layers[0].paint['line-offset']`,
          params: {
            min: "-10",
            max: "10",
            step: "0.5",
            default: "0",
            units: "px"
          }
        },
      ],
    },
    {
      label: 'Opacity',
      type: 'inline',
      controls: [
        {
          type: 'range',
          unit: '%',
          path: `layers[1].paint['line-opacity']`,
          params: {
            min: "0",
            max: "1",
            step: "0.01",
            default: "0.75",
            units: "%",
            format: (v) => Math.round(v * 100)
          }
        },
      ],
    }
  ]
}

export default typeConfigs