import sqlite3
import string
import random
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS, cross_origin
from markupsafe import re
#from sim_settings.settings import models
import argparse
import os
from activitysim.cli.run import add_run_args, run
import json
import csv
import yaml
import requests
from redis import Redis
from rq import Queue
import rq
import overpy
import re
import geojson
import overpass
import psycopg2

# import popsynth



queue = rq.Queue('rq_popsynth', connection=Redis(), default_timeout=600)


app = Flask(__name__)
cors = CORS(app, support_credentials=True)
app.config['CORS_HEADERS'] = 'Content-Type'


@app.route('/')
@cross_origin(supports_credentials=True)
def index():
    return 'Server Works!'


@app.route('/greet')
def say_hello():
    return 'Hello from Server'


def getHash():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


def get_db_connection():
    conn = sqlite3.connect('database/activitysimserver.sqlite')
    conn.row_factory = row_to_dict
    return conn


def row_to_dict(cursor: sqlite3.Cursor, row: sqlite3.Row) -> dict:
    data = {}
    for idx, col in enumerate(cursor.description):
        data[col[0]] = row[idx]
    return data


def formatBgId(bgs):
    # add statecode 36+ 3 digit county code + 7 digit blockgroupIDs?
    # if blockgroup id is 6 digit add preceding 0
    for i, bg in enumerate(bgs):
        bg[i] = bg.zfill(7)
    return bgs


@app.route('/projects/<userId>')
def projectsByUser(userId):
    conn = get_db_connection()
    # cursor = conn.cursor()
    projects = conn.execute(
        'SELECT a.id, a.Name as name, a.geoList as geo_list, a.options, a.status FROM projects_users INNER JOIN projects as a ON projects_users.project_id=a.id WHERE projects_users.user_id=?', (userId,)).fetchall()
    # print("what is user ID", userId, cursor.lastrowid)
    return jsonify(projects)





# @app.route('/projects/pumageometry/getosm/<projectId>/<selectedPUMA>')
@app.route('/projects/pumageometry/getosm/<selectedPUMA>')
def osmBySelectedPuma(selectedPUMA):
    
    # con = get_db_connection()
    # cur = con.cursor()
    print ("selectedPUMA", selectedPUMA, selectedPUMA[-1], type(selectedPUMA))
    

    conn = psycopg2.connect(database="kari", 
                            user="dama_dev_user", 
                            password="57e5b991-630f-4ca8-8078-f552744a2cf1", 
                            host="mercury.availabs.org", port="5532") 
    
    curr= conn.cursor()
   
    # print("connection_test", conn )

    # selectedPUMA_str = ','.join(map(str, selectedPUMA))

    # postgres db start here----
    # bbbox
    
    curr.execute(f'''
        SELECT ST_Extent(geometry) AS bounding_box
        FROM avl_modeler_datasets.tl_2019_36_puma10
        WHERE geoid10 IN ('{selectedPUMA}')''')
    selectedBB_postgres = curr.fetchall()

    print("selectedBB_postgres------", selectedBB_postgres)

# # Extracting coordinates and reformatting
#     bboxpg = {}
#     for item in selectedBB_postgres:
#         # Extracting coordinates from the string
#         coordinates = item[0].split("(")[1].split(")")[0].split(",")
#         for i, coord in enumerate(coordinates):
#             lat, lon = coord.split()
#             if i == 0:
#                 bboxpg['min_x'] = float(lat)
#                 bboxpg['min_y'] = float(lon)
#             else:
#                 bboxpg['max_x'] = float(lat)
#                 bboxpg['max_y'] = float(lon)


#     print("bboxpg", bboxpg["min_y"],bboxpg["min_x"],bboxpg["max_y"],bboxpg["max_x"])


#     # Query Overpass API to get osm json
#     api = overpass.API(timeout=600)
#     # mapQuery = overpass.MapQuery(min_y, min_x,max_y,max_x)  //for sqlite
    
#     mapQuery = overpass.MapQuery(bboxpg["min_y"],bboxpg["min_x"],bboxpg["max_y"],bboxpg["max_x"])
#     res = api.get(mapQuery, responseformat="json")


#     # test simple SQL query
#     curr.execute(f'''
#         SELECT id, geoid10, namelsad10
#         FROM avl_modeler_datasets.tl_2019_36_puma10
#         WHERE geoid10 IN ('3601600')
#     ''')
#     response_test = curr.fetchall()

#     print("response_test", response_test, selectedPUMA, res["elements"][:5])




# # Function to check if a table exists
#     def table_exists(curr, selectedPUMA):

#         curr.execute(f'''SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'avl_modeler_datasets'and table_name = 'osm_nodes_{selectedPUMA}')''')

#         return curr.fetchone()[0]

#     # Check if the table exists

#     if not table_exists(curr, selectedPUMA):



#         # curr.execute(f'''DROP TABLE IF EXISTS avl_modeler_datasets.osm_nodes''')
#         curr.execute(f'''
#                         CREATE TABLE IF NOT EXISTS avl_modeler_datasets.osm_nodes_{selectedPUMA}  (
#                             id BIGINT,
#                             lat FLOAT,
#                             lon FLOAT,
#                             tags TEXT
#                         )''')

#         # Create way table
#         # curr.execute(f'''DROP TABLE IF EXISTS avl_modeler_datasets.osm_ways''')
#         curr.execute(f'''CREATE TABLE IF NOT EXISTS avl_modeler_datasets.osm_ways_{selectedPUMA} (
#                             id BIGINT,
#                             nodes TEXT,
#                             tags TEXT
#                         )''')

#         # Create relation table
#         # curr.execute(f'''DROP TABLE IF EXISTS avl_modeler_datasets.osm_relations''')
#         curr.execute(f'''CREATE TABLE IF NOT EXISTS avl_modeler_datasets.osm_relations_{selectedPUMA} (
#                             id BIGINT,
#                             members TEXT,
#                             tags TEXT
#                         )''')

#         conn.commit()


#         # chunk the data
#         def chunks(lst, n):
#             """Yield successive n-sized chunks from lst."""
#             for i in range(0, len(lst), n):
#                 yield lst[i:i + n]

#         # Insert osmjson in chunks
#         try:
#             for element_chunk in chunks(res['elements'], 1000):  
#                 nodes_data = []
#                 ways_data = []
#                 relations_data = []
#                 for element in element_chunk:
#                     if element['type'] == 'node':
#                         nodes_data.append((element['id'], element['lat'], element['lon'], json.dumps(element.get('tags', {}))))
#                     elif element['type'] == 'way':
#                         ways_data.append((element['id'], json.dumps(element['nodes']), json.dumps(element.get('tags', {}))))
#                     elif element['type'] == 'relation':
#                         relations_data.append((element['id'], json.dumps(element['members']), json.dumps(element.get('tags', {}))))

#                 # Insert into nodes table
#                 if nodes_data:
#                     curr.executemany(f'''INSERT INTO avl_modeler_datasets.osm_nodes_{selectedPUMA} (id, lat, lon, tags)
#                                         VALUES (%s, %s, %s, %s)''', nodes_data)
#                 # Insert into ways table
#                 if ways_data:
#                     curr.executemany(f'''INSERT INTO avl_modeler_datasets.osm_ways_{selectedPUMA} (id, nodes, tags)
#                                         VALUES (%s, %s, %s)''', ways_data)
#                 # Insert into relations table
#                 if relations_data:
#                     curr.executemany(f'''INSERT INTO avl_modeler_datasets.osm_relations_{selectedPUMA} (id, members, tags)
#                                         VALUES (%s, %s, %s)''', relations_data)

#             conn.commit()
#             print("Postgres data inserted")

#         except Exception as e:
#             print("Error inserting data:", e)

#             # Rollback the transaction in case of error
#             conn.rollback()
#         finally:
        
#         # Add geometry column to node table
#             curr.execute(f'''ALTER TABLE avl_modeler_datasets.osm_nodes_{selectedPUMA} ADD COLUMN geom GEOMETRY(Point, 4326)''')

#         #create spatial index
        
#             curr.execute(f'''CREATE INDEX idx_osm_nodes_{selectedPUMA}_geom ON avl_modeler_datasets.osm_nodes_{selectedPUMA} USING gist (geom)''')

#         # Populate geometry column with Point geometries
#             curr.execute(f'''UPDATE avl_modeler_datasets.osm_nodes_{selectedPUMA} SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326)''')
            
#             print("geom in nodes table is created")

# # from postgresdb filter out only the nodes within selected puma

#     curr.execute(f'''SELECT
#                         b.id as node_id
#                         FROM avl_modeler_datasets.osm_nodes_{selectedPUMA} AS b
#                         Inner JOIN avl_modeler_datasets.tl_2019_36_puma10 AS a
#                         ON 
#                             ST_contains(a.geometry, b.geom)
#                         WHERE  a.geoid10 in ('{selectedPUMA}')
#                     ''')
#     containedNodes = curr.fetchall()
    
    # print ("containedNodes----", containedNodes[:10], type(containedNodes), len(containedNodes))

#    fetch planet_osm_roads table
    # SELECT osm_id, access, "addr:housename", "addr:housenumber", "addr:interpolation", admin_level, aerialway, aeroway, amenity, area, barrier, bicycle, brand, bridge, boundary, building, construction, covered, culvert, cutting, denomination, disused, embankment, foot, "generator:source", harbour, highway, historic, horse, intermittent, junction, landuse, layer, leisure, lock, man_made, military, motorcar, name, "natural", office, oneway, operator, place, population, power, power_source, public_transport, railway, ref, religion, route, service, shop, sport, surface, toll, tourism, "tower:type", tracktype, tunnel, water, waterway, wetland, width, wood, z_order, way_area, way
	# FROM public.planet_osm_roads;


    # curr.execute(f'''SELECT
    #                     b.osm_id as id, b.highway, b.way
    #                     FROM public.planet_osm_roads AS b
    #                     Inner JOIN avl_modeler_datasets.tl_2019_36_puma10 AS a
    #                     ON 
    #                         ST_contains(a.geometry, b.way)
    #                     WHERE  a.geoid10 in ('{selectedPUMA}') and b.highway in ('primary','secondary', 'tertiary', 'truck', 'motorway')
    #                 ''')
    # containedWays = curr.fetchall()
    
    # print ("containedWays----", containedWays[:10], type(containedWays), len(containedWays))



# SELECT jsonb_build_object(
#     'type',       'Feature',
#     'id',         gid,
#     'geometry',   ST_AsGeoJSON(geom)::jsonb,
#     'properties', to_jsonb(row) - 'gid' - 'geom'
# ) FROM (SELECT * FROM input_table) row;


    curr.execute(f'''SELECT jsonb_build_object(
                            'type',       'Feature',
                            'id',         osm_id,
                            'geometry',   ST_AsGeoJSON(ST_Transform(way, 4326))::jsonb,
                            'properties', to_jsonb(inputs) - 'osm_id' - 'geom'
                             ) AS feature
                        FROM (
                            SELECT
                            *
                            FROM public.planet_osm_roads
                            Inner JOIN avl_modeler_datasets.tl_2019_36_puma10 AS a
                            ON 
                                ST_contains(a.geometry, way)
                            WHERE  a.geoid10 in ('{selectedPUMA}') and highway in ('primary','secondary', 'tertiary', 'truck', 'motorway')
                            ) inputs;
                        ''')

    # curr.execute(f'''SELECT jsonb_build_object(
    #                         'type',     'FeatureCollection',
    #                         'features', jsonb_agg(features.feature)
    #                     )
    #                     FROM (
    #                     SELECT jsonb_build_object(
    #                         'type',       'Feature',
    #                         'id',         osm_id,
    #                         'geometry',   ST_AsGeoJSON(ST_Transform(way, 4326))::jsonb,
    #                         'properties', to_jsonb(inputs) - 'osm_id' - 'geom'
    #                          ) AS feature
    #                     FROM (
    #                         SELECT
    #                         *
    #                         FROM public.planet_osm_roads
    #                         Inner JOIN avl_modeler_datasets.tl_2019_36_puma10 AS a
    #                         ON 
    #                             ST_contains(a.geometry, way)
    #                         WHERE  a.geoid10 in ('{selectedPUMA}') and highway in ('primary','secondary', 'tertiary', 'truck', 'motorway')
    #                         ) inputs
    #                         ) features;
    #                 ''')
    containedWays = curr.fetchall()

    contained_ways = [d for (d,) in containedWays]

    
    # print ("containedWays----", containedWays[:1], containedWaysNew[:2], type(containedWays), len(containedWays))
    print ("containedWaysNew----", contained_ways[:1], type(contained_ways), len(contained_ways))
   
    print ("containedWays done")




    

    # format containedNodes--this needs to be modified when there are muliple puma selected... or consequtive puma selected
    # try:
      
    #     if containedNodes is not None:
    #         containedNodes2 = [item[0] for item in containedNodes]
    #         print("containedNodes done")
    #     else:
    #         print("No results found")
    # except Exception as e:
    #     print("Error executing SQL query:", e)

    print("postgres done")
    
    conn.commit()

    curr.close()
    conn.close()

       # the FeatureCollection
    feature_collection = {
        "type": "FeatureCollection",
        "features": contained_ways
    }



#  reformat res into geojson
    
    # Create a dictionary to map {node IDs: [lon, lat]..}
    # node_id_to_coords = {}


    # for element in res["elements"]:
    #     if element.get("type") == "node":


    #         #original node_id_to_coords
    #         # node_id_to_coords[element["id"]] = (element["lon"], element["lat"])


    #         # to filter only the contained list of node --{1111111: [77.29384,45939292], 2222222:[]

    #         if 'id' in element and element['id'] in containedNodes2:
    #             # contained_element = {key: element[key] for key in element}
    #             contained_element = element 
    #             node_id_to_coords[contained_element["id"]] = (contained_element["lon"], contained_element["lat"])
    
    # # Initialize features
    # features = []

    # for element in res["elements"]:
      
    #     if element.get("type") == "way":
            
    #         # Extract the nodes list containing node IDs
    #         node_ids = element.get("nodes", [])

    #         coordinates = [node_id_to_coords[node_id] for node_id in node_ids if node_id in node_id_to_coords]

    #         # filter highway with 5 highway values
    #         highway_type = element.get("tags", {}).get("highway")
    #         if highway_type in {"primary", "secondary", "tertiary", "truck", "motorway"}:
    #             feature = {
    #                 "type": "Feature",
    #                 "id": f"way/{element['id']}",
    #                 "geometry": {
    #                     "type": "LineString",
    #                     "coordinates": coordinates
    #                 },
    #                 "properties": element.get("tags", {})  
    #             }
            

    #             features.append(feature)
            
    # # the FeatureCollection
    # feature_collection = {
    #     "type": "FeatureCollection",
    #     "features": features
    # }

    # # Convert the FeatureCollection to JSON
    # geojson_str = json.dumps(feature_collection)

    # save the file
    # with open("./test_4.geojson",mode="w") as f:
    #     geojson.dump(feature_collection,f)

   
    return jsonify(feature_collection)



@app.route('/projects/pumageometry/<selectedPUMA>')
def selectedPumaBoundingbox(selectedPUMA):
    
    con = get_db_connection()
    cur = con.cursor()


    print ("selectedPUMAid---", selectedPUMA)

# load specialite
    con.enable_load_extension(True)

    # cur.execute(''' SELECT load_extension('/usr/local/lib/mod_spatialite')''')
    cur.execute(''' SELECT load_extension('/home/jin/miniforge3/envs/ASIM_DEV_new/lib/mod_spatialite')''')
    


    selected_puma_bb = f'''SELECT
                        AsText(ST_Envelope(ST_Union(ST_GeomFromWKB(geometry)))) as boundingBox
                        FROM tl_2019_36_puma10
                         WHERE  geoid10 in ('''+selectedPUMA+''')'''


    selectedBB = con.execute(selected_puma_bb).fetchall()
 
    return jsonify(selectedBB)

    print('selectedBB----', selectedBB)









@app.route('/projects/geometry/<selectedPUMA>')
def selectedBGgeometry(selectedPUMA):
    
    con = get_db_connection()
    cur = con.cursor()


    # selectedBGsStr = ''.join(selectedBGs)
    # selectedBGsStr ="'" + "','".join(selectedBGs) + "'"
    # # print("selectedBGs",selectedBGs, len(selectedBGs))
    # print("selectedBGsStr", selectedBGsStr,  len(selectedBGsStr))
    print ("selectedPUMAGeoids---", selectedPUMA)

# load specialite
    con.enable_load_extension(True)

    # cur.execute(''' SELECT load_extension('/usr/local/lib/mod_spatialite')''')
    cur.execute(''' SELECT load_extension('/home/jin/miniforge3/envs/ASIM_DEV_new/lib/mod_spatialite')''')
    


    selected_bg_table = f'''SELECT
                        b.geoid as geoid_bg,
                        a.geoid10 as geoid_puma
                     
                        FROM tl_2019_36_bg AS b
                        INNER JOIN tl_2019_36_puma10 AS a
                        ON 

                            (ST_Contains(
                                GeomFromWKB(a.geometry), GeomFromWKB(b.geometry)
                                         )
                                )
                      
                        WHERE  a.geoid10 in ('''+selectedPUMA+''')
                        '''

# need to swtich a and b 

    # selected_bg_table = f'''SELECT
    #                     a.geoid as geoid_bg,
    #                     b.geoid10 as geoid_puma
                     
    #                     FROM tl_2019_36_bg AS a
    #                     INNER JOIN tl_2019_36_puma10 AS b
    #                     ON (

    #                         (ST_Contains(
    #                             GeomFromWKB(a.geometry), GeomFromWKB(b.geometry)
    #                                      )
    #                             )
    #                         OR
    #                         (
    #                            st_intersects(
    #                            GeomFromWKB(a.geometry), GeomFromWKB(b.geometry)
    #                                         )
    #                            and

    #                         (
    #                             (
    #                                 st_area(
    #                                     st_intersection(
    #                                     GeomFromWKB(a.geometry), GeomFromWKB(b.geometry)
    #                                                     )
    #                                        )
    #                                 /
    #                                 st_area(GeomFromWKB(a.geometry))
    #                             )
    #                             >
    #                             0.5
    #                         )
                            
    #                        )
    #                     )

    #                     WHERE  b.geoid10 in ('''+selectedPUMA+''')
                         
    #                     '''

    selectedBGsTable = con.execute(selected_bg_table).fetchall()
    selectedBGs = [ sub['geoid_bg'] for sub in selectedBGsTable ]
    return jsonify(selectedBGs)

    print('selectedBGIDs----', selectedBGsTable, selectedBGs)

    con.commit()
    con.close()


# status route to sequence the status
@app.route('/project/<projectId>/status')
def statusByProject(projectId):
    conn = get_db_connection()
    # cursor = conn.cursor()
    status = conn.execute(
        #     'SELECT a.id, a.status FROM projects as a where a.id =?', (projectId,)).fetchall()
        # return jsonify(status)

        'SELECT a.status FROM projects as a where a.id =?', (projectId,)).fetchall()
    return jsonify(status)


@app.route('/project/<projectId>/list_vars')
def viewVarsByProjectId(projectId):
    conn = get_db_connection()

    hhsql = "SELECT name FROM PRAGMA_TABLE_INFO('project_" + \
        projectId+"_households')"
    psql = "SELECT name FROM PRAGMA_TABLE_INFO('project_" + \
        projectId+"_persons')"

    households = conn.execute(
        hhsql).fetchall()
    persons = conn.execute(
        psql).fetchall()

    hhkeys = ['h_' + d['name'] for d in households if 'name' in d][5:]
    personskeys = ['p_' + d['name'] for d in persons if 'name' in d][5:]

    # output
    # [
    #     hh_hinc,
    #     hh_wif,
    #     ...
    #     p_inc,
    #     p_age,
    # ]

    return jsonify(hhkeys+personskeys)


@app.route('/project/<projectId>/<selectedVar>')
def viewBySelectedVar(projectId, selectedVar):
    conn = get_db_connection()

    type = selectedVar[0]
    selectedVariable = selectedVar[2:]

    print("var_Names", selectedVar, type, selectedVariable)

    # rewrite to contain GEOID

    hhsql = f'''
	SELECT {selectedVariable},project_{projectId}_households.BG, project_{projectId}_geocrosswalk.BLKGRP as GEOID
    FROM project_{projectId}_households
    JOIN project_{projectId}_geocrosswalk ON PRINTF('%07d', project_{projectId}_households.BG) = project_{projectId}_geocrosswalk.BG'''

    psql = f'''SELECT {selectedVariable},project_{projectId}_persons.BG, project_{projectId}_geocrosswalk.BLKGRP as GEOID
    FROM project_{projectId}_persons
    JOIN project_{projectId}_geocrosswalk ON PRINTF('%07d', project_{projectId}_persons.BG) = project_{projectId}_geocrosswalk.BG'''

    # hhsql = f'''SELECT {selectedVariable},BG FROM project_{projectId}_households'''
    # psql = f'''SELECT {selectedVariable},BG FROM project_{projectId}_persons'''

    if type == "h":
        projects = conn.execute(
            hhsql).fetchall()

        # selectedBGs = [d["BG"] for d in projects if "BG" in d]
        # selectedVarValue = map(lambda d: d[selectedVariable], projects)
        selectedBGs = [d["BG"] for d in projects if "BG" in d]

        print("projects----------", projects[:5], selectedBGs[:5])

        return jsonify(projects)

    elif type == "p":
        projects = conn.execute(
            psql).fetchall()
        # print("projects----------", projects)
        return jsonify(projects)


# @app.route('/project/<projectId>/<selectedVar>/<any(Bgs):selectedBgs>')
# @app.route("/project/<projectId>/<selectedVar>/<any({}):segment>".format(str(selectedBgs)[1:-1]))
@app.route("/project/<projectId>/<selectedVar>/<any('option1', 'option2'):segment>")
def SynPopDataBySelectedBgs(projectId, selectedVar, segment):
    conn = get_db_connection()

    type = selectedVar[0]
    selectedVariable = selectedVar[2:]

    # need to format this remove [] and remove first digits
    shortenbgs = filter(lambda x: x[5:], segment)
    bgs = str(shortenbgs)[1:-1]


# SELECT * FROM project_46_households WHERE BG IN (702001, 702002);

    print("var_Names", selectedVar, type, selectedVariable)

    hhsql = f'''SELECT {selectedVariable} FROM project_{projectId}_households WHERE BG IN ({bgs})'''
    psql = f'''SELECT {selectedVariable} FROM project_{projectId}_persons WHERE BG IN ({bgs})'''
    # hhsql = "SELECT ? FROM project_"+projectId+"_households", (selectedVar,)
    # psql =  "SELECT  ? FROM project_"+projectId+"_persons", (selectedVar,)

    if type == "h":
        projects = conn.execute(
            hhsql).fetchall()
        print("projects----------", projects)
        return jsonify(projects)

    elif type == "p":
        projects = conn.execute(
            psql).fetchall()
        print("projects----------", projects)
        return jsonify(projects)


@app.route('/project/<projectId>/overview')
def countsByProjectId(projectId):
    conn = get_db_connection()

    hhsql = "SELECT COUNT(1) as num_hh FROM project_"+projectId+"_households"
    psql = "SELECT COUNT(1) as num_p FROM project_"+projectId+"_persons"

    households = conn.execute(
        hhsql).fetchall()
    persons = conn.execute(
        psql).fetchall()
    print("total households and persons",
          households[0].values(), persons[0].values(), households[0]["num_hh"], persons[0]["num_p"], households, persons)

    # return jsonify({"projectID": projectId, "Households": households[0].values()[0].num_hh, "Persons": persons})
    return jsonify({"projectID": projectId, "Households": households[0]["num_hh"], "Persons": persons[0]["num_p"]})


@app.route('/project/<projectId>/view')
def viewByProjectId(projectId):
    conn = get_db_connection()

    hhsql = "SELECT * FROM project_"+projectId+"_households"
    psql = "SELECT * FROM project_"+projectId+"_persons"

    households = conn.execute(
        hhsql).fetchall()
    persons = conn.execute(
        psql).fetchall()
    print("synpop households and persons",
          households[0].values(), persons[0].values())

    return jsonify({"projectID": projectId, "Households": households, "Persons": persons})


@app.route('/project/<projectId>/delete')
def deleteByProjectId(projectId):

    # con = sqlite3.connect("database/activitysimserver.sqlite")
    # cur = con.cursor()
    conn = get_db_connection()
    cur = conn.cursor()
    # delete project from projects and projects_user table
    cur.execute('''DELETE from projects where id = ?''', (projectId,))
    cur.execute(
        '''DELETE from projects_users where project_id = ?''', (projectId,))

   # drop synpop outputs if exist
    dropdatadicsql = f'''drop table if exists project_{projectId}_datadict'''
    dropgeocrosswalksql = f'''drop table if exists project_{projectId}_geocrosswalk'''
    drophhsql = f'''drop table if exists project_{projectId}_households'''
    droppsql = f'''drop table if exists project_{projectId}_persons'''
    droplandusesql = f'''drop table if exists project_{projectId}_landuse'''
    dropdistancesql = f'''drop table if exists project_{projectId}_distance'''

    cur.execute(dropdatadicsql).fetchall()
    cur.execute(dropgeocrosswalksql).fetchall()
    cur.execute(drophhsql).fetchall()
    cur.execute(droppsql).fetchall()
    cur.execute(droplandusesql).fetchall()
    cur.execute(dropdistancesql).fetchall()
    

    conn.commit()

    print("selected project deleted successfully ")

    conn.close()

    return "{\"response\": \"deleted\"}"


@app.route('/pums/psam/<type>/<puma_id>')
def pumaDataById(type, puma_id):
    conn = get_db_connection()
    if type == "h":
        projects = conn.execute(
            'SELECT * FROM psam_h36  WHERE psam_h36.PUMA=?', (puma_id,)).fetchall()
        return jsonify(projects)
    elif type == "p":
        projects = conn.execute(
            'SELECT * FROM psam_p36  WHERE psam_p36.PUMA=?', (puma_id,)).fetchall()
        return jsonify(projects)


@app.route('/project/<projectId>/geometryIds')
def getGeometryIds(projectId):

    conn = get_db_connection()
    cur = conn.cursor()

    # drop synpop outputs if exist
    hhsGeometrySql = f'''select distinct PUMA,BG from project_{projectId}_households'''
    personsGeometrySql = f'''select distinct PUMA, BG from project_{projectId}_persons'''
    crosswalkGeometrySql = f'''select distinct PUMA, BLKGRP from project_{projectId}_geocrosswalk'''

    hhGeometry = cur.execute(hhsGeometrySql).fetchall()
    personsGeometry = cur.execute(personsGeometrySql).fetchall()
    crosswalkGeometry = cur.execute(crosswalkGeometrySql).fetchall()

    # print ( "geometryTable-",hhGeometry )

    return jsonify({"households": hhGeometry, "persons": personsGeometry, "crosswalk": crosswalkGeometry})


@app.route('/project/create', methods=['POST'])
def projectCreate():
    # check user details from db
    print("post success")
    request_data = request.json
    # print(request_data['userId'], request_data)
    # return jsonify(request_data)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO projects values (?, ?, ?, ?)', (None, request_data['project_name'], None, None))

    print("project ID", cursor.lastrowid, " is successfully inserted")

    cursor.execute(
        'INSERT INTO projects_users values (?, ?)', (request_data['userId'], cursor.lastrowid))
    conn.commit()

    return "inserted"



@app.route('/project/create_1', methods=['POST'])
# queue = rq.Queue('popSynth_test3', connection=Redis())
# job = queue.enqueue(projectCreate_1)
def projectCreate_1():
    # check user details from db
    print("post success")
    print(getHash())

    request_data_sql = request.json
    # print("request_data_sql", request_data_sql)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO projects values (?, ?, ?, ?, ?)', (None, request_data_sql['project_name'], None, request_data_sql['status'], None))

    print("project ID", cursor.lastrowid, " is successfully inserted")

    cursor.execute(
        'INSERT INTO projects_users values (?, ?)', (request_data_sql['userId'], cursor.lastrowid))

    conn.commit()

    # if(request.json['project_data']):

    request_data = request.json['project_data']

    # print("crosswork", request_data['crosswork_data'])

    # -- To Do ---
    # 1 - Create a hash code hash()
    # 2 - Create a folder called popsynth_runs/$hash_code

    cwdpath = os.getcwd()
    print("The current working directory is %s" % cwdpath)

    # parent_dir = cwdpath
    # directory = "/popsynth_runs/" + getHash()
    # path = os.path.join(parent_dir,"/popsynth_runs/", directory)

    # parent_dir = "/home/jin/AVAIL/code/avl-modeler2/server/popsynth_runs/"
    parent_dir = os.getcwd() + '/popsynth_runs/'
    # directory =  getHash()
    directory = str(cursor.lastrowid)
    path = os.path.join(parent_dir, directory)

    # popsynth.deleteFolder(path)

    # 3 - in the new folder create config, data and output folders
    subfolder_names = ["configs", "data", "output"]
    # subfolder_names = ["configs", "data"]

    file_names = ["controls", "geo_cross_walk",  "control_totals_tract",
                  "control_totals_bg", "seed_households", "seed_persons", "settings"]

    # file_names = ["controls","geo_cross_walk",  "control_totals_tract", "control_totals_bg","seed_households", "seed_persons"]

    print('keys', request_data.keys())

    # splite json input data to single json file

    config_data = request_data['control_config']
    crosswork_data = request_data['crosswork_data']

    control_data = request_data['control_data']
    control_tracts = control_data['control_tracts']
    control_bgs = control_data['control_bgs']

    seed_data = request_data['seed_data']
    seed_household = seed_data['household']
    seed_person = seed_data['person']

    settings = request_data['setting']

    selectedBGs = [d['BLKGRP'] for d in crosswork_data]
    

    print('crosswork_data---', crosswork_data, selectedBGs )



    # for d in crosswork_data:
    #  selectedBGs= d['BLKGRP']
    

    if not os.path.exists(path):
        #  os.mkdir(os.path.join(path, 'output'))

        for i, subfolder_name in enumerate(subfolder_names):

            # make folders
            os.makedirs(os.path.join(path, subfolder_name))

    # 4 - write output files from json data to the matching folder

            # config folder
            if i == 0:

                complete_path = os.path.join(
                    path, subfolder_name, file_names[0]+".csv")

                data_file = open(complete_path, "w")

                # create the csv writer object
                csv_writer = csv.writer(data_file)

                # Counter variable used for writing
                # headers to the CSV file
                count = 0

                for data in config_data:
                    if count == 0:

                        # Writing headers of CSV file
                        header = data.keys()
                        csv_writer.writerow(header)
                        count += 1

                    # Writing data of CSV file
                    csv_writer.writerow(data.values())

                data_file.close()

            # do yaml here

                complete_path_yaml = os.path.join(
                    path, subfolder_name, file_names[6]+".yaml")
                with open(complete_path_yaml, 'w') as file:
                    yaml.dump(settings, file)
                    print('settings.yaml', yaml.dump(settings))

            # data folder
            elif i == 1:

                path1 = os.path.join(path, subfolder_name,
                                     file_names[1]+".csv")
                path2 = os.path.join(path, subfolder_name,
                                     file_names[2]+".csv")
                path3 = os.path.join(path, subfolder_name,
                                     file_names[3]+".csv")
                path4 = os.path.join(path, subfolder_name,
                                     file_names[4]+".csv")
                path5 = os.path.join(path, subfolder_name,
                                     file_names[5]+".csv")

                complete_path = [path1, path2, path3, path4, path5]
                data_data = [crosswork_data, control_tracts,
                             control_bgs, seed_household, seed_person]

                for i, pathi in enumerate(complete_path):

                    data_file = open(pathi, "w")

                    # create the csv writer object
                    csv_writer = csv.writer(data_file)

                    # Counter variable used for writing
                    # headers to the CSV file
                    count = 0

                    for data in data_data[i]:
                        if count == 0:

                            # Writing headers of CSV file
                            header = data.keys()
                            csv_writer.writerow(header)
                            count += 1

                        # Writing data of CSV file
                        csv_writer.writerow(data.values())

                        # os.path.join( "/home/jin/AVAIL/code/avl-modeler2/server/popsynth_runs/configs", data_file)

                    data_file.close()


#   create a task for RQ

    # before we queue our task
    # insert new record into sqlite projects table with project name
    # this should be able to return a id number from the insert
    # use the project ID instead of the hash to create the new folder
    # add new column status to project table, set status to processing

    # return to the client the object #{id: $project_id, project_name: '', status: 'processing' }

    # queue = rq.Queue('rq_popsynth', connection=Redis())

    parser = argparse.ArgumentParser()
    add_run_args(parser)
    args = parser.parse_args(
        ['--working_dir', os.getcwd() + '/popsynth_runs/' + directory])
    print('testing args', args)
    # job = queue.enqueue(run(args))
    #
    project_id = directory
    project_name = request_data_sql['project_name']
    status = request_data_sql['status']

    job = queue.enqueue('tasks.popsynth.run_popsynth', args, project_id, selectedBGs, job_timeout=3600)

    return "{\"reponse\": \"success\"}"
    # return "{\"id\": project_id, \"project_name\": project_name, \"status\": status}"


@app.route('/senario/create', methods=['POST'])
def senarioTableCreate():
    # check user details from db
    print("post success")
    request_data = request.json
    
    print("request_data", request_data)

    project_id = request_data['project_id']
    # return jsonify(request_data)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO senarios values (?, ?, ?, ?)', (None, request_data['senario_name'], request_data['status'], request_data['project_id']))

    conn.commit()

    # run senario
    # parser = argparse.ArgumentParser()
    # add_run_args(parser)
    # args = parser.parse_args()
    # sys.exit(run(args))

    senario_id = str(cursor.lastrowid) 
    # queue = rq.Queue('rq_activitysim', connection=Redis())

    parser = argparse.ArgumentParser()
    add_run_args(parser)
    args = parser.parse_args(  ['--working_dir', os.getcwd() + '/popsynth_runs/test_prototype_mtc_new/'])
    # args = parser.parse_args(  ['--working_dir', os.getcwd() + '/popsynth_runs/activitysim/activitysim/examples/test_prototype_mtc_new/'])
    # path= '~/AVAIL/code/avl-modeler2/server/popsynth_runs/test_prototype_mtc_new'
   
    job = queue.enqueue('tasks.popsynth.run_senario', args, project_id, senario_id, job_timeout=3600)
    # job = queue.enqueue('run_senario', args, project_id, senario_id)

    return "{\"message\": \"this message\"}"



@app.route('/senarios/<projectId>')
def senarioByProjectId(projectId):
    conn = get_db_connection()
    # cursor = conn.cursor()
    seniaros = conn.execute(
        'SELECT * FROM senarios WHERE senarios.project_id=?', (projectId,)).fetchall()
    # print("what is user ID", userId, cursor.lastrowid)
    return jsonify(seniaros)



@app.route('/senarios/<senarioId>/status')
def statusBySenario(senarioId):
    conn = get_db_connection()
    # cursor = conn.cursor()
    status = conn.execute(
        #     'SELECT a.id, a.status FROM projects as a where a.id =?', (projectId,)).fetchall()
        # return jsonify(status)

        'SELECT status FROM senarios where id =?', (senarioId,)).fetchall()
    return jsonify(status)


@app.route('/senarios/<senarioId>/overview')
def overviewBySenario(senarioId):
    conn = get_db_connection()
    # cursor = conn.cursor()

    hhsql = "SELECT COUNT(1) as num_hh FROM senario_"+senarioId+"_households"
    psql = "SELECT COUNT(1) as num_p FROM senario_"+senarioId+"_persons"
    tsql = "SELECT COUNT(1) as num_t FROM senario_"+senarioId+"_trips"
    

    households = conn.execute(
        hhsql).fetchall()
    persons = conn.execute(
        psql).fetchall()
    trips = conn.execute(
        tsql).fetchall()
    
    print("total households and persons",
          households[0].values(), persons[0].values(), households[0]["num_hh"], persons[0]["num_p"], households, persons)

    # return jsonify({"projectID": projectId, "Households": households[0].values()[0].num_hh, "Persons": persons})
    return jsonify({"senarioId": senarioId, "Households": households[0]["num_hh"], "Persons": persons[0]["num_p"],"Trips": trips[0]["num_t"]})



@app.route('/senarios/<senarioId>/<projectId>/destination/')
def destinationBySenario(senarioId, projectId):
   conn = get_db_connection()

   destinationSql = "SELECT senario_"+senarioId+"_trips.destination AS TAZ, project_"+projectId+"_households.BG AS bg, COUNT(1) AS count FROM senario_"+senarioId+"_trips INNER JOIN project_"+projectId+"_households ON project_"+projectId+"_households.TAZ = senario_"+senarioId+"_trips.destination GROUP BY TAZ"

   destination = conn.execute(destinationSql).fetchall()

#    print("destination", destination )

   return jsonify(destination)