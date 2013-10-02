var BaseMapProviders = mxn.BaseMapProviders = {
	OpenStreetMap: {
		url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		options: {
			label: 'OpenStreetMap',
			attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
				'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
		},
		variants: {
			BlackAndWhite: {
				url: 'http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png',
				options: {
					label: 'OSM B&amp;W'
				}
			},
			DE: {
				url: 'http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
				options: {
					label: 'OSM DE'
				}
			}
		}
	},
	OpenCycleMap: {
		url: 'http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png',
		options: {
			label: 'OpenCycleMap',
			attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, {attribution.OpenStreetMap}'
		}
	},
	MapQuestOpen: {
		url: 'http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg',
		options: {
			label: 'MQ Open',
			alt: 'MQ Open Streets',
			attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' +
				'Map data {attribution.OpenStreetMap}',
			subdomains: '1234'
		},
		variants: {
			Aerial: {
				url: 'http://oatile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg',
				options: {
					label: 'MQ Open Aerial',
					attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' +
						'Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
				}
			}
		}
	},
	Stamen: {
		url: 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png',
		options: {
			label: 'Stamen',
			attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
				'<a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; ' +
				'Map data {attribution.OpenStreetMap}',
			subdomains: 'abcd',
			minZoom: 0,
			maxZoom: 20
		},
		variants: {
			TonerBackground: {
				url: 'http://{s}.tile.stamen.com/toner-background/{z}/{x}/{y}.png',
				options: {
					label: 'Toner Background'
				}
			},
			TonerHybrid: {
				url: 'http://{s}.tile.stamen.com/toner-hybrid/{z}/{x}/{y}.png',
				options: {
					label: 'Toner Hybrid'
				}
			},
			TonerLines: {
				url: 'http://{s}.tile.stamen.com/toner-lines/{z}/{x}/{y}.png',
				options: {
					label: 'Toner Lines'
				}
			},
			TonerLabels: {
				url: 'http://{s}.tile.stamen.com/toner-labels/{z}/{x}/{y}.png',
				options: {
					label: 'Toner Labels'
				}
			},
			TonerLite: {
				url: 'http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png',
				options: {
					label: 'Toner Lite'
				}
			},
			Terrain: {
				url: 'http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.jpg',
				options: {
					label: 'Stamen Terrain',
					minZoom: 4,
					maxZoom: 18
				}
			},
			TerrainBackground: {
				url: 'http://{s}.tile.stamen.com/terrain-background/{z}/{x}/{y}.jpg',
				options: {
					label: 'Stamen Background',
					minZoom: 4,
					maxZoom: 18
				}
			},
			Watercolor: {
				url: 'http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg',
				options: {
					label: 'Watercolor',
					minZoom: 3,
					maxZoom: 16
				}
			}
		}
	},
	Acetate: {
		url: 'http://a{s}.acetate.geoiq.com/tiles/acetate-hillshading/{z}/{x}/{y}.png',
		options: {
			label: 'Acetate',
			attribution: '&copy;2012 Esri & Stamen, Data from OSM and Natural Earth',
			subdomains: '0123',
			minZoom: 2,
			maxZoom: 18
		},
		variants: {
			basemap: {
				url: 'http://a{s}.acetate.geoiq.com/tiles/acetate-base/{z}/{x}/{y}.png',
				options: {
					label: 'Acetate Base'
				}
			},
			terrain: {
				url: 'http://a{s}.acetate.geoiq.com/tiles/terrain/{z}/{x}/{y}.png',
				options: {
					label: 'Terrain',
					alt: 'Acetate Terrain'
				}
			},
			foreground: {
				url: 'http://a{s}.acetate.geoiq.com/tiles/acetate-fg/{z}/{x}/{y}.png',
				options: {
					label: 'Acetate Foreground'
				}
			},
			roads: {
				url: 'http://a{s}.acetate.geoiq.com/tiles/acetate-roads/{z}/{x}/{y}.png',
				options: {
					label: 'Acetate Roads'
				}
			},
			labels: {
				url: 'http://a{s}.acetate.geoiq.com/tiles/acetate-labels/{z}/{x}/{y}.png',
				options: {
					label: 'Acetate Labels'
				}
			},
			hillshading: {
				url: 'http://a{s}.acetate.geoiq.com/tiles/hillshading/{z}/{x}/{y}.png',
				options: {
					label: 'Acetate Hills'
				}
			}
		}
	},
	Esri: {
		url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
		options: {
			label: 'Esri',
			alt: 'Esri',
			attribution: 'Tiles &copy; Esri'
		},
		variants: {
			WorldStreetMap: {
				options: {
					label: 'Esri World Streets',
					attribution: '{attribution.Esri} &mdash; ' +
						'Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
				}
			},
			DeLorme: {
				url: 'http://server.arcgisonline.com/ArcGIS/rest/services/Specialty/DeLorme_World_Base_Map/MapServer/tile/{z}/{y}/{x}',
				options: {
					label: 'Esri DeLorme',
					minZoom: 1,
					maxZoom: 11,
					attribution: '{attribution.Esri} &mdash; Copyright: &copy;2012 DeLorme'
				}
			},
			WorldTopoMap: {
				url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
				options: {
					label: 'Esri World Topo',
					alt: 'Esri World Topology',
					attribution: '{attribution.Esri} &mdash; ' +
						'Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
				}
			},
			WorldImagery: {
				url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
				options: {
					label: 'Esri Imagery',
					alt: 'Esri Satellite Imagery',
					attribution: '{attribution.Esri} &mdash; ' +
						'Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
				}
			},
			WorldTerrain: {
				url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
				options: {
					label: 'Esri Terrain',
					alt: 'Esri World Terrain',
					maxZoom: 13,
					attribution: '{attribution.Esri} &mdash; ' +
						'Source: USGS, Esri, TANA, DeLorme, and NPS'
				}
			},
			WorldShadedRelief: {
				url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
				options: {
					label: 'Esri Relief',
					maxZoom: 13,
					attribution: '{attribution.Esri} &mdash; Source: Esri'
				}
			},
			WorldPhysical: {
				url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
				options: {
					label: 'Esri Physical',
					alt: 'Esri Physical',
					maxZoom: 8,
					attribution: '{attribution.Esri} &mdash; Source: US National Park Service'
				}
			},
			OceanBasemap: {
				url: 'http://services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}',
				options: {
					label: 'Esri Ocean',
					maxZoom: 13,
					attribution: '{attribution.Esri} &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri'
				}
			},
			NatGeoWorldMap: {
				url: 'http://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
				options: {
					label: 'Esri NatGeo',
					maxZoom: 16,
					attribution: '{attribution.Esri} &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
				}
			},
			WorldGrayCanvas: {
				url: 'http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
				options: {
					label: 'Esri Canvas',
					maxZoom: 16,
					attribution: '{attribution.Esri} &mdash; Esri, DeLorme, NAVTEQ'
				}
			}
		}
	},
	OpenWeatherMap: {
		options: {
			label: 'OpenWeatherMap',
			attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
			opacity: 0.5
		},
		variants: {
			Clouds: {
				url: 'http://{s}.tile.openweathermap.org/map/clouds/{z}/{x}/{y}.png',
				options: {
					label: 'Clouds'
				}
			},
			CloudsClassic: {
				url: 'http://{s}.tile.openweathermap.org/map/clouds_cls/{z}/{x}/{y}.png',
				options: {
					label: 'Clouds Classic'
				}
			},
			Precipitation: {
				url: 'http://{s}.tile.openweathermap.org/map/precipitation/{z}/{x}/{y}.png',
				options: {
					label: 'Precipitation'
				}
			},
			PrecipitationClassic: {
				url: 'http://{s}.tile.openweathermap.org/map/precipitation_cls/{z}/{x}/{y}.png',
				options: {
					label: 'Pricipitation Classic'
				}
			},
			Rain: {
				url: 'http://{s}.tile.openweathermap.org/map/rain/{z}/{x}/{y}.png',
				options: {
					label: 'Rain'
				}
			},
			RainClassic: {
				url: 'http://{s}.tile.openweathermap.org/map/rain_cls/{z}/{x}/{y}.png',
				options: {
					label: 'Rain Classic'
				}
			},
			Pressure: {
				url: 'http://{s}.tile.openweathermap.org/map/pressure/{z}/{x}/{y}.png',
				options: {
					label: 'Pressure'
				}
				
			},
			PressureContour: {
				url: 'http://{s}.tile.openweathermap.org/map/pressure_cntr/{z}/{x}/{y}.png',
				options: {
					label: 'Pressure Contour'
				}
			},
			Wind: {
				url: 'http://{s}.tile.openweathermap.org/map/wind/{z}/{x}/{y}.png',
				options: {
					label: 'Wind'
				}
			},
			Temperature: {
				url: 'http://{s}.tile.openweathermap.org/map/temp/{z}/{x}/{y}.png',
				options: {
					label: 'Temperature'
				}
			},
			Snow: {
				url: 'http://{s}.tile.openweathermap.org/map/snow/{z}/{x}/{y}.png',
				options: {
					label: 'Snow'
				}
			}
		}
	}
};
