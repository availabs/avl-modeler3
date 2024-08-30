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
import psycopg2.extras


# import popsynth



queue = rq.Queue('rq_popsynth', connection=Redis(), default_timeout=600)


app = Flask(__name__)
cors = CORS(app, support_credentials=True)
app.config['CORS_HEADERS'] = 'Content-Type'

# connpg = psycopg2.connect(database="kari", 
#                         user="dama_dev_user", 
#                         password="57e5b991-630f-4ca8-8078-f552744a2cf1", 
#                         host="mercury.availabs.org", port="5532") 
    
# currpg= connpg.cursor()


def get_db_connection_pg():
    conn = psycopg2.connect(
                        database="kari", 
                        user="dama_dev_user", 
                        password="57e5b991-630f-4ca8-8078-f552744a2cf1", 
                        host="mercury.availabs.org", port="5532"
                        )
    return conn

def get_db_connection_pg_neptune():
    conn = psycopg2.connect(
                        database="postgres", 
                        user="postgres", 
                        password="1234", 
                        host="neptune.availabs.org", port="5437"
                        )
    return conn


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


@app.route('/projects/<int:userId>')
def projectsByUser(userId):

    conn = get_db_connection_pg()
    curr = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

    
    query = f'''SELECT id, "Name" AS name, "geoList" AS geo_list, options, status FROM avl_modeler_datasets.projects_users INNER JOIN avl_modeler_datasets.projects AS a ON avl_modeler_datasets.projects_users.project_id = a.id WHERE avl_modeler_datasets.projects_users.user_id = %s'''
    
    curr.execute(query, (userId,))
    projects = curr.fetchall()
    print("what is user ID", userId, projects)
    return jsonify(projects)


# @app.route('/projects/<userId>')
# def projectsByUser(userId):
#     conn = get_db_connection()
#     # cursor = conn.cursor()
#     projects = conn.execute(
#         'SELECT a.id, a.Name as name, a.geoList as geo_list, a.options, a.status FROM projects_users INNER JOIN projects as a ON projects_users.project_id=a.id WHERE projects_users.user_id=?', (userId,)).fetchall()
#     # print("what is user ID", userId, cursor.lastrowid)
#     return jsonify(projects)




# @app.route('/projects/pumageometry/getosm/<projectId>/<selectedPUMA>')
@app.route('/projects/pumageometry/getosm/<selectedPUMA>')
def osmBySelectedPuma(selectedPUMA):

    conn = get_db_connection_pg()
    # conn = get_db_connection_pg_neptune()
    curr = conn.cursor()

    print ("selectedPUMA", selectedPUMA, selectedPUMA[-1], type(selectedPUMA))
    

    # conn = psycopg2.connect(database="kari", 
    #                         user="dama_dev_user", 
    #                         password="57e5b991-630f-4ca8-8078-f552744a2cf1", 
    #                         host="mercury.availabs.org", port="5532") 
    
    # curr= conn.cursor()
   
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


    # curr.execute(f'''SELECT jsonb_build_object(
    #                         'type',       'Feature',
    #                         'id',         osm_id,
    #                         'geometry',   ST_AsGeoJSON(ST_Transform(way, 4326))::jsonb,
    #                         'properties', to_jsonb(inputs) - 'osm_id' - 'geom'
    #                          ) AS feature
    #                     FROM (
    #                         SELECT
    #                         *
    #                         FROM avl_modeler_osm.planet_osm_roads
    #                         Inner JOIN avl_modeler_datasets.tl_2019_36_puma10 AS a
    #                         ON 
    #                             ST_contains(a.geometry, way)
    #                         WHERE  a.geoid10 in ('{selectedPUMA}') and highway in ('primary','secondary', 'tertiary', 'truck', 'motorway')
    #                         ) inputs;
    #                     ''')




    curr.execute(f'''SELECT jsonb_build_object(
                            'type',       'Feature',
                            'id',         osm_id,
                            'geometry',   ST_AsGeoJSON(ST_Transform(way, 4326))::jsonb,
                            'properties', to_jsonb(inputs) - 'osm_id' - 'geom'
                             ) AS feature
                        FROM (
                            SELECT
                            *
                            FROM avl_modeler_osm.planet_osm_roads
                            Inner JOIN avl_modeler_datasets.tl_2019_36_puma10 AS a
                            ON 
                                ST_contains(a.geometry, way)
                            WHERE  a.geoid10 in ('{selectedPUMA}') and highway in ('primary','secondary', 'tertiary', 'truck', 'motorway')
                            ) inputs;
                        ''')

    
    containedWays = curr.fetchall()

    contained_ways = [d for (d,) in containedWays]
    
    print ("containedWaysNew----", contained_ways[:1], type(contained_ways), len(contained_ways))
   
    print ("containedWays done")


    print("postgres done")
    
    conn.commit()

    curr.close()
    conn.close()

    # the FeatureCollection
    feature_collection = {
        "type": "FeatureCollection",
        "features": contained_ways
    }


    return jsonify(feature_collection)




@app.route('/projects/pumageometry/getosmid/<selectedPUMA>')
def osmidsBySelectedPuma(selectedPUMA):
    conn = get_db_connection_pg_neptune()
    # conn = get_db_connection_pg()
    curr = conn.cursor()

    print ("selectedPUMA", selectedPUMA, selectedPUMA[-1], type(selectedPUMA))
    

    # conn = psycopg2.connect(database="kari", 
    #                         user="dama_dev_user", 
    #                         password="57e5b991-630f-4ca8-8078-f552744a2cf1", 
    #                         host="mercury.availabs.org", port="5532") 
    
    # curr= conn.cursor()
   
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


    # curr.execute(f'''SELECT jsonb_build_object(
    #                         'type',       'Feature',
    #                         'id',         osm_id,
    #                         'geometry',   ST_AsGeoJSON(ST_Transform(way, 4326))::jsonb,
    #                         'properties', to_jsonb(inputs) - 'osm_id' - 'geom'
    #                          ) AS feature
    #                     FROM (
    #                         SELECT
    #                         *
    #                         FROM avl_modeler_osm.planet_osm_roads
    #                         Inner JOIN avl_modeler_datasets.tl_2019_36_puma10 AS a
    #                         ON 
    #                             ST_contains(a.geometry, way)
    #                         WHERE  a.geoid10 in ('{selectedPUMA}') and highway in ('primary','secondary', 'tertiary', 'truck', 'motorway')
    #                         ) inputs;
    #                     ''')



   # For mercury server

    # curr.execute(f''' SELECT
    #                         osm_id
    #                         FROM avl_modeler_osm.planet_osm_roads
    #                         Inner JOIN avl_modeler_datasets.tl_2019_36_puma10 AS a
    #                         ON 
                             
    #                             ST_contains(a.geometry, way)
    #                         WHERE  a.geoid10 in ('{selectedPUMA}') 
                            
    #                     ''')


    # for neptune and modified query to handle SRID mismatch 
     
    # curr.execute(f'''
    #                 SELECT
    #                     osm_id
    #                 FROM avl_modeler_osm.nys_osm_roads
    #                 INNER JOIN avl_modeler_datasets.tl_2019_36_puma10 AS a
    #                 ON ST_Contains(
    #                     ST_Transform(ST_SetSRID(a.geometry, 4326), 4326),
    #                     nys_osm_roads.way
    #                 )
    #                 WHERE a.geoid10 IN ('{selectedPUMA}')
    # ''')


    curr.execute(f'''
                    SELECT
                        osm_id
                    FROM avl_modeler_osm.nys_osm_roads_linestrings
                    INNER JOIN avl_modeler_datasets.tl_2019_36_puma10 AS a
                    ON ST_Contains(
                        ST_Transform(ST_SetSRID(a.geometry, 4326), 4326),
                        nys_osm_roads_linestrings.geom
                    )
                    WHERE a.geoid10 IN ('{selectedPUMA}')
    ''')


    
    containedOsmids = curr.fetchall()

    contained_osm_ids = [d for (d,) in containedOsmids]
    
    print ("containedWaysNew----", contained_osm_ids[:1], type(contained_osm_ids), len(contained_osm_ids))
   
    print ("contained_osm_ids done")


    print("postgres done")
    
    conn.commit()

    curr.close()
    conn.close()

    # # the FeatureCollection
    # feature_collection = {
    #     "type": "FeatureCollection",
    #     "features": contained_ways
    # }


    return jsonify(contained_osm_ids)





# to get BG geometries for selected PUMA 
@app.route('/projects/geometry/<selectedPUMA>')
def selectedBGgeometry(selectedPUMA):
    
    conn = get_db_connection_pg()
    curr = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

    print ("selectedPUMAGeoids---", selectedPUMA)

    query = f"""
    SELECT
        b.geoid as geoid_bg,
        a.geoid10 as geoid_puma
        FROM avl_modeler_datasets.tl_2019_36_bg AS b
        INNER JOIN avl_modeler_datasets.tl_2019_36_puma10 AS a
        ON ST_Contains(a.geometry, ST_Centroid(b.geometry))
        WHERE a.geoid10 IN ('{selectedPUMA}')
    """
    curr.execute(query)
    selectedBGsTable = curr.fetchall()


    selectedBGs = [ sub['geoid_bg'] for sub in selectedBGsTable ]
 

    print('selectedBGIDs----', selectedBGsTable, selectedBGs)

    conn.commit()
    conn.close()

    return jsonify(selectedBGs)

@app.route('/projects/<projectId>/status')
def statusByProject(projectId):
    conn = get_db_connection_pg()
    curr = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

    query = 'SELECT status FROM avl_modeler_datasets.projects WHERE id = %s'
    curr.execute(query, (projectId,))

    status = curr.fetchall()
    print ("status----", status)

    curr.close()
    conn.close()

    return jsonify(status)
    


# drop down var list
@app.route('/project/<projectId>/list_vars')
def viewVarsByProjectId(projectId):
    conn = get_db_connection_pg()
    curr = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

    # hhsql = "SELECT name FROM PRAGMA_TABLE_INFO('project_" + \
    #     projectId+"_households')"
    # psql = "SELECT name FROM PRAGMA_TABLE_INFO('project_" + \
    #     projectId+"_persons')"
    
    hhsql = f"""
        SELECT column_name as name
        FROM information_schema.columns 
        WHERE table_schema = 'avl_modeler_projects' 
        AND table_name = 'project_{projectId}_households'
     
    """

    psql = f"""
        SELECT column_name as name
        FROM information_schema.columns 
        WHERE table_schema = 'avl_modeler_projects' 
        AND table_name = 'project_{projectId}_persons'

    """

    curr.execute(hhsql)
    households = curr.fetchall()

    curr.execute(psql)
    persons = curr.fetchall()

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

    curr.close()
    conn.close()

    print ('var_list-----------', households, persons, hhkeys)

    return jsonify(hhkeys+personskeys)




@app.route('/project/<projectId>/<selectedVar>')
def viewBySelectedVar(projectId, selectedVar):
    conn = get_db_connection_pg()
    curr = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

    type = selectedVar[0]
    selectedVariable = selectedVar[2:]

    print("var_Names", selectedVar, type, selectedVariable)

    # rewrite to contain GEOID

    hhsql = f'''
    SELECT "{selectedVariable}", avl_modeler_projects.project_{projectId}_households."BG", 
           avl_modeler_projects.project_{projectId}_geocrosswalk."BLKGRP" as GEOID
    FROM avl_modeler_projects.project_{projectId}_households
    JOIN avl_modeler_projects.project_{projectId}_geocrosswalk 
    ON LPAD(CAST(avl_modeler_projects.project_{projectId}_households."BG" AS TEXT), 7, '0') = avl_modeler_projects.project_{projectId}_geocrosswalk."BG"
    '''

    psql = f'''
    SELECT "{selectedVariable}", avl_modeler_projects.project_{projectId}_persons."BG", 
           avl_modeler_projects.project_{projectId}_geocrosswalk."BLKGRP" as GEOID
    FROM avl_modeler_projects.project_{projectId}_persons
    JOIN avl_modeler_projects.project_{projectId}_geocrosswalk 
    ON LPAD(CAST(avl_modeler_projects.project_{projectId}_persons."BG" AS TEXT), 7, '0') = avl_modeler_projects.project_{projectId}_geocrosswalk."BG"
    '''



    if type == "h":
        curr.execute(hhsql)
        projects = curr.fetchall()

        # selectedBGs = [d["BG"] for d in projects if "BG" in d]
        # selectedVarValue = map(lambda d: d[selectedVariable], projects)
        selectedBGs = [d["BG"] for d in projects if "BG" in d]

        print("projects----------", projects[:5], selectedBGs[:5])

        return jsonify(projects)

    elif type == "p":
        curr.execute(psql)
        projects = curr.fetchall()
        # print("projects----------", projects)
        return jsonify(projects)



@app.route('/project/<int:projectId>/overview')
def countsByProjectId(projectId):
    conn = get_db_connection_pg()
    curr = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)
    # curr = conn.cursor()


    hhsql = f'''SELECT COUNT(1) as num_hh FROM avl_modeler_projects.project_{projectId}_households'''
    psql = f'''SELECT COUNT(1) as num_p FROM avl_modeler_projects.project_{projectId}_persons'''

    curr.execute(hhsql)
    households = curr.fetchall()

    curr.execute(psql)
    persons = curr.fetchall()

    # households = curr.execute(
    #     hhsql).fetchall()
    # persons = curr.execute(
    #     psql).fetchall()

    # # Since fetchall() returns a list of tuples and we expect one row as result, we can access the count using index 0
    # num_hh = households[0][0]
    # num_p = persons[0][0]

    print("total households and persons", households, persons, households[0]["num_hh"], persons[0]["num_p"])

    return jsonify({"projectID": projectId, "Households": households[0]["num_hh"], "Persons": persons[0]["num_p"]})

# @app.route('/project/<projectId>/overview')
# def countsByProjectId(projectId):
#     conn = get_db_connection()

#     hhsql = "SELECT COUNT(1) as num_hh FROM project_"+projectId+"_households"
#     psql = "SELECT COUNT(1) as num_p FROM project_"+projectId+"_persons"

#     households = conn.execute(
#         hhsql).fetchall()
#     persons = conn.execute(
#         psql).fetchall()
#     print("total households and persons",
#           households[0].values(), persons[0].values(), households[0]["num_hh"], persons[0]["num_p"], households, persons)

#     # return jsonify({"projectID": projectId, "Households": households[0].values()[0].num_hh, "Persons": persons})
#     return jsonify({"projectID": projectId, "Households": households[0]["num_hh"], "Persons": persons[0]["num_p"]})



# @app.route('/project/<projectId>/view')
# def viewByProjectId(projectId):
#     conn = get_db_connection()

#     hhsql = "SELECT * FROM project_"+projectId+"_households"
#     psql = "SELECT * FROM project_"+projectId+"_persons"

#     households = conn.execute(
#         hhsql).fetchall()
#     persons = conn.execute(
#         psql).fetchall()
#     print("synpop households and persons",
#           households[0].values(), persons[0].values())

#     return jsonify({"projectID": projectId, "Households": households, "Persons": persons})


@app.route('/project/<projectId>/delete')
def deleteByProjectId(projectId):
    conn = get_db_connection_pg()
    cur = conn.cursor()

    # Delete project from projects and projects_users table
    cur.execute('DELETE FROM avl_modeler_datasets.projects WHERE id = %s', (projectId,))
    cur.execute('DELETE FROM avl_modeler_datasets.projects_users WHERE project_id = %s', (projectId,))

    # Drop synpop outputs if exist
    dropdatadicsql = f'DROP TABLE IF EXISTS avl_modeler_projects.project_{projectId}_datadict'
    dropgeocrosswalksql = f'DROP TABLE IF EXISTS avl_modeler_projects.project_{projectId}_geocrosswalk'
    drophhsql = f'DROP TABLE IF EXISTS avl_modeler_projects.project_{projectId}_households'
    droppsql = f'DROP TABLE IF EXISTS avl_modeler_projects.project_{projectId}_persons'
    droplandusesql = f'DROP TABLE IF EXISTS avl_modeler_projects.project_{projectId}_landuse'
    dropdistancesql = f'DROP TABLE IF EXISTS avl_modeler_projects.project_{projectId}_distance'

    cur.execute(dropdatadicsql)
    cur.execute(dropgeocrosswalksql)
    cur.execute(drophhsql)
    cur.execute(droppsql)
    cur.execute(droplandusesql)
    cur.execute(dropdistancesql)
    
    conn.commit()

    print("Selected project deleted successfully")

    cur.close()
    conn.close()

    return "{\"response\": \"deleted\"}"


@app.route('/pums/psam/<type>/<puma_id>')
# def pumaDataById(type, puma_id):
#     conn = get_db_connection()
#     if type == "h":
#         projects = conn.execute(
#             'SELECT * FROM psam_h36  WHERE psam_h36.PUMA=?', (puma_id,)).fetchall()
#         return jsonify(projects)
#     elif type == "p":
#         projects = conn.execute(
#             'SELECT * FROM psam_p36  WHERE psam_p36.PUMA=?', (puma_id,)).fetchall()
#         return jsonify(projects)

def pumaDataById(type, puma_id):
    conn = get_db_connection_pg()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    if type == "h":
        cur.execute(
            'SELECT * FROM avl_modeler_datasets.psam_h36 WHERE "PUMA" = %s',  (str(puma_id),))
        projects = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(projects)
    elif type == "p":
        cur.execute( 
            'SELECT * FROM avl_modeler_datasets.psam_p36 WHERE "PUMA" = %s',  (str(puma_id),))
        projects = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(projects)


@app.route('/project/<projectId>/geometryIds')
def getGeometryIds(projectId):

    conn = get_db_connection_pg()
    curr = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)
    
    # drop synpop outputs if exist
    # hhsGeometrySql = f'''select distinct PUMA,BG from project_{projectId}_households'''
    # personsGeometrySql = f'''select distinct PUMA, BG from project_{projectId}_persons'''
    # crosswalkGeometrySql = f'''select distinct PUMA, BLKGRP from project_{projectId}_geocrosswalk'''
    
    hhsGeometrySql = f'''SELECT DISTINCT "PUMA", "BG" FROM avl_modeler_projects.project_{projectId}_households'''
    personsGeometrySql = f'''SELECT DISTINCT "PUMA", "BG" FROM avl_modeler_projects.project_{projectId}_persons'''
    crosswalkGeometrySql = f'''SELECT DISTINCT "PUMA", "BLKGRP" FROM avl_modeler_projects.project_{projectId}_geocrosswalk'''


    curr.execute(hhsGeometrySql)
    hhGeometry = curr.fetchall()

    curr.execute(personsGeometrySql)
    personsGeometry = curr.fetchall()

    curr.execute(crosswalkGeometrySql)
    crosswalkGeometry = curr.fetchall()

    print ( "geometryTable-",hhGeometry )

    return jsonify({"households": hhGeometry, "persons": personsGeometry, "crosswalk": crosswalkGeometry})

# @app.route('/project/<projectId>/geometryIds')
# def getGeometryIds(projectId):

#     conn = get_db_connection()
#     cur = conn.cursor()

#     # drop synpop outputs if exist
#     hhsGeometrySql = f'''select distinct PUMA,BG from project_{projectId}_households'''
#     personsGeometrySql = f'''select distinct PUMA, BG from project_{projectId}_persons'''
#     crosswalkGeometrySql = f'''select distinct PUMA, BLKGRP from project_{projectId}_geocrosswalk'''

#     hhGeometry = cur.execute(hhsGeometrySql).fetchall()
#     personsGeometry = cur.execute(personsGeometrySql).fetchall()
#     crosswalkGeometry = cur.execute(crosswalkGeometrySql).fetchall()

#     print ( "geometryTable-",hhGeometry )

#     return jsonify({"households": hhGeometry, "persons": personsGeometry, "crosswalk": crosswalkGeometry})



# @app.route('/project/create', methods=['POST'])
# def projectCreate():
#     # check user details from db
#     print("post success")
#     request_data = request.json
#     # print(request_data['userId'], request_data)
#     # return jsonify(request_data)
#     conn = get_db_connection()
#     cursor = conn.cursor()
#     cursor.execute(
#         'INSERT INTO projects values (?, ?, ?, ?)', (None, request_data['project_name'], None, None))

#     print("project ID", cursor.lastrowid, " is successfully inserted")

#     cursor.execute(
#         'INSERT INTO projects_users values (?, ?)', (request_data['userId'], cursor.lastrowid))
#     conn.commit()

#     return "inserted"



@app.route('/project/create_1', methods=['POST'])

def projectCreate_1():
    # check user details from db
    print("post success")
    print(getHash())

    request_data_sql = request.json

    # pretty_json = json.dumps(request_data_sql, indent=4)

    # lines = pretty_json.split('\n')
    # first_10_lines = '\n'.join(lines[:100])

    # print("request_data_sql", first_10_lines)

    conn = get_db_connection_pg()
    # cursor = conn.cursor()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cursor.execute(
        'INSERT INTO avl_modeler_datasets.projects ("Name", "status") VALUES (%s, %s) RETURNING id', 
        (request_data_sql['project_name'], request_data_sql['status'])
    )

    project_id = cursor.fetchone()['id']

    print("project ID", project_id, "is successfully inserted")

    cursor.execute(
        'INSERT INTO avl_modeler_datasets.projects_users (user_id, project_id) VALUES (%s, %s)', 
        (request_data_sql['userId'], project_id)
    )

    conn.commit()

    request_data = request.json['project_data']

    cwdpath = os.getcwd()
    print("The current working directory is %s" % cwdpath)

    parent_dir = os.getcwd() + '/popsynth_runs/'
    directory = str(project_id)
    path = os.path.join(parent_dir, directory)

    subfolder_names = ["configs", "data", "output"]
    file_names = ["controls", "geo_cross_walk", "control_totals_tract",
                  "control_totals_bg", "seed_households", "seed_persons", "settings"]

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

    print('crosswork_data---', crosswork_data, selectedBGs)

    if not os.path.exists(path):
        for i, subfolder_name in enumerate(subfolder_names):
            os.makedirs(os.path.join(path, subfolder_name))

            if i == 0:
                complete_path = os.path.join(
                    path, subfolder_name, file_names[0]+".csv")

                with open(complete_path, "w", newline='') as data_file:
                    csv_writer = csv.writer(data_file)
                    count = 0
                    for data in config_data:
                        if count == 0:
                            header = data.keys()
                            csv_writer.writerow(header)
                            count += 1
                        csv_writer.writerow(data.values())

                complete_path_yaml = os.path.join(
                    path, subfolder_name, file_names[6]+".yaml")
                with open(complete_path_yaml, 'w') as file:
                    yaml.dump(settings, file)
                    print('settings.yaml', yaml.dump(settings))

            elif i == 1:
                complete_paths = [
                    os.path.join(path, subfolder_name, file_names[1]+".csv"),
                    os.path.join(path, subfolder_name, file_names[2]+".csv"),
                    os.path.join(path, subfolder_name, file_names[3]+".csv"),
                    os.path.join(path, subfolder_name, file_names[4]+".csv"),
                    os.path.join(path, subfolder_name, file_names[5]+".csv")
                ]

                data_list = [crosswork_data, control_tracts, control_bgs, seed_household, seed_person]

                for complete_path, data_set in zip(complete_paths, data_list):
                    with open(complete_path, "w", newline='') as data_file:
                        csv_writer = csv.writer(data_file)
                        count = 0
                        for data in data_set:
                            if count == 0:
                                header = data.keys()
                                csv_writer.writerow(header)
                                count += 1
                            csv_writer.writerow(data.values())

    parser = argparse.ArgumentParser()
    add_run_args(parser)
    args = parser.parse_args(
        ['--working_dir', os.getcwd() + '/popsynth_runs/' + directory]
    )
    print('testing args', args)

    project_id = directory

    job = queue.enqueue('tasks.popsynth.run_popsynth', args, project_id, selectedBGs, job_timeout=3600)

    return jsonify({"response": "success"})




@app.route('/senario/create', methods=['POST'])
def senarioTableCreate():
    # check user details from db
    print("post success")
    request_data = request.json
    
    print("request_data", request_data)

    project_id = request_data['project_id']
    # return jsonify(request_data)
    conn = get_db_connection_pg()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cursor.execute(
        'INSERT INTO avl_modeler_datasets.senarios (name, status, project_id) VALUES (%s, %s, %s) RETURNING id', 
        (request_data['senario_name'], request_data['status'], request_data['project_id'])
    )
    senario_id = cursor.fetchone()['id']
    print("Senario ID", senario_id, "is successfully inserted")

    conn.commit()
    # run senario
    # parser = argparse.ArgumentParser()
    # add_run_args(parser)
    # args = parser.parse_args()
    # sys.exit(run(args))

    # senario_id = str(cursor.lastrowid) 

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

    conn = get_db_connection_pg()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cursor.execute(
        'SELECT * FROM avl_modeler_datasets.senarios WHERE project_id = %s', (projectId,))
    senarios = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(senarios)


@app.route('/senarios/<senarioId>/status')
def statusBySenario(senarioId):

    conn = get_db_connection_pg()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cursor.execute(
        'SELECT status FROM avl_modeler_datasets.senarios WHERE id = %s', (senarioId,))
    status = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(status)


@app.route('/senarios/<senarioId>/overview')
def overviewBySenario(senarioId):

    conn = get_db_connection_pg()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    hhsql = f"SELECT COUNT(1) as num_hh FROM avl_modeler_senarios.senario_{senarioId}_households"
    psql = f"SELECT COUNT(1) as num_p FROM avl_modeler_senarios.senario_{senarioId}_persons"
    tsql = f"SELECT COUNT(1) as num_t FROM avl_modeler_senarios.senario_{senarioId}_trips"

    cursor.execute(hhsql)
    households = cursor.fetchall()
    
    cursor.execute(psql)
    persons = cursor.fetchall()
    
    cursor.execute(tsql)
    trips = cursor.fetchall()
    
    print("total households and persons", households[0]["num_hh"], persons[0]["num_p"], trips[0]["num_t"])

    cursor.close()
    conn.close()

    return jsonify({"senarioId": senarioId, "Households": households[0]["num_hh"], "Persons": persons[0]["num_p"], "Trips": trips[0]["num_t"]})



@app.route('/senarios/<senarioId>/<projectId>/destination/')
def destinationBySenario(senarioId, projectId):
#    conn = get_db_connection()

#    destinationSql = "SELECT senario_"+senarioId+"_trips.destination AS TAZ, project_"+projectId+"_households.BG AS bg, COUNT(1) AS count 
# FROM senario_"+senarioId+"_trips 
# INNER JOIN project_"+projectId+"_households 
#  ON project_"+projectId+"_households.TAZ = senario_"+senarioId+"_trips.destination 
#  GROUP BY TAZ"

#    destination = conn.execute(destinationSql).fetchall()

# #    print("destination", destination )

#    return jsonify(destination)

    conn = get_db_connection_pg()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    destinationSql = f"""
        SELECT 
            s.destination::integer AS "TAZ", 
            p."BG" AS bg, 
            COUNT(1) AS count 
        FROM 
            avl_modeler_senarios.senario_{senarioId}_trips s
        INNER JOIN 
            avl_modeler_projects.project_{projectId}_households p
        ON 
            p."TAZ" = s.destination::integer 
        GROUP BY 
            s.destination::integer, p."BG";
    """

    cursor.execute(destinationSql)
    destination = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(destination)




@app.route('/network/<int:sourceid>/<int:targetid>')
def shortestNetwork(sourceid, targetid):
    conn = get_db_connection_pg_neptune()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # query = '''
    # SELECT * FROM pgr_dijkstra(
    #     'SELECT id, source, target, cost, reverse_cost FROM avl_modeler_osm.nys_osm_roads_noded',
    #     %s,
    #     %s,
    #     false
    # )
    # '''

    # query = '''
    #     WITH path AS (
    #         SELECT * FROM pgr_dijkstra(
    #             'SELECT id, source, target, cost, reverse_cost FROM avl_modeler_osm.nys_osm_roads_noded',
    #             %s,
    #             %s,
    #             false
    #         )
    #     )
    #     SELECT p.seq, p.path_seq, p.start_vid, p.end_vid, p.node, p.edge, p.cost, p.agg_cost, n.osm_id
    #     FROM path AS p
    #     JOIN avl_modeler_osm.nys_osm_roads_noded AS n ON p.edge = n.id;
    #     '''

    query = '''
        WITH path AS (
            SELECT * FROM pgr_dijkstra(
                'SELECT id, source, target, cost, reverse_cost FROM avl_modeler_osm.nys_osm_roads_linestrings_noded',
                %s,
                %s,
                false
            )
        )
        SELECT p.seq, p.path_seq, p.start_vid, p.end_vid, p.node, p.edge, p.cost, p.agg_cost, n.osm_id
        FROM path AS p
        JOIN avl_modeler_osm.nys_osm_roads_linestrings_noded AS n ON p.edge = n.id;
        '''



    
    cursor.execute(query, (sourceid, targetid))
    status = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(status)



@app.route('/network/nearest/<coordinates>')
def nearestVertex(coordinates):
    conn = get_db_connection_pg_neptune()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    print ("coordinates", coordinates)
    
    # regular expression to extract lng and lat from the coordinates string
    match = re.match(r'\{lng: (-?\d+\.\d+), lat: (\d+\.\d+)\}', coordinates)
    lng = float(match.group(1))
    lat = float(match.group(2))

    print("Longitude:", lng, "Latitude:", lat)

    query = '''
    SELECT v.id, v.the_geom
    FROM avl_modeler_osm.nys_osm_roads_noded_vertices_pgr AS v,
        avl_modeler_osm.nys_osm_roads_noded AS e
    WHERE v.id = (
        SELECT id 
        FROM avl_modeler_osm.nys_osm_roads_noded_vertices_pgr
        ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint(%s, %s), 4326)
        LIMIT 1
    )
    AND (e.source = v.id OR e.target = v.id)
    GROUP BY v.id, v.the_geom;
    '''
    
    cursor.execute(query, (lng, lat))
    status = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(status)


@app.route('/network/nearest1/<lng>/<lat>')
def nearestVertex1(lng,lat):
    conn = get_db_connection_pg_neptune()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)



    print("Longitude:", lng, "Latitude:", lat)

    query = '''
    SELECT v.id, v.the_geom
    FROM avl_modeler_osm.nys_osm_roads_linestrings_noded_vertices_pgr AS v,
        avl_modeler_osm.nys_osm_roads_linestrings_noded AS e
    WHERE v.id = (
        SELECT id 
        FROM avl_modeler_osm.nys_osm_roads_linestrings_noded_vertices_pgr
        ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint(%s, %s), 4326)
        LIMIT 1
    )
    AND (e.source = v.id OR e.target = v.id)
    GROUP BY v.id, v.the_geom;
    '''
    
    cursor.execute(query, (lng, lat))
    status = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(status)
