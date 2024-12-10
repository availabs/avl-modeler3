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

import openmatrix as omx
import numpy as np
import pandas as pd
from sqlalchemy import create_engine


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

    # simple roads
     
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
                    AND nys_osm_roads_linestrings.fclass IN (
                    'motorway', 'motorway_link',
                    'trunk', 'trunk_link',
                    'primary', 'primary_link',
                    'secondary', 'secondary_link',
                    'tertiary', 'tertiary_link',
                    'unclassified',
                    'residential'
                )
         
    ''')

             #     AND nys_osm_roads_linestrings.fclass IN (
                #     'motorway', 'motorway_link',
                #     'trunk', 'trunk_link',
                #     'primary', 'primary_link',
                #     'secondary', 'secondary_link',
                #     'tertiary', 'tertiary_link',
                #     'unclassified',
                #     'residential'
                # )
    
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

    # complete contained bgIDs to make model work with all PUMAs

    # query = f"""
    # SELECT
    #     b.geoid as geoid_bg,
    #     a.geoid10 as geoid_puma
    #     FROM avl_modeler_datasets.tl_2019_36_bg AS b
    #     INNER JOIN avl_modeler_datasets.tl_2019_36_puma10 AS a
    #     ON ST_Contains(a.geometry, b.geometry)
    #     WHERE a.geoid10 IN ('{selectedPUMA}')
    # """
    
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

    # return "{\"message\": \"this message\"}"
    return jsonify({"message": "Scenario created successfully", "id": senario_id})



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



@app.route('/senarios/<senarioId>/trip/')

def destinationOverviewBySenario(senarioId):


    conn = get_db_connection_pg()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

     
    countSql = f"""
            SELECT destination, count(1)
            FROM avl_modeler_senarios.senario_{senarioId}_trips
            group by destination
             """
    cursor.execute(countSql)
    trip = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(trip)


@app.route('/senarios/<senarioId>/<selectedVariable>/overviewByMode/')

def variableOverviewBySenario(senarioId, selectedVariable):


    conn = get_db_connection_pg()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

     
    countSql = f"""
            SELECT {selectedVariable}, count(1) as "Total"
            FROM avl_modeler_senarios.senario_{senarioId}_trips
            group by {selectedVariable}
             """
    cursor.execute(countSql)
    trip = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(trip)


@app.route('/senarios/<senarioId>/<selectedVariable>/<selectedMetaKey>/overviewByMode/')

def variableMetaKeyOverviewBySenario(senarioId, selectedVariable, selectedMetaKey):


    conn = get_db_connection_pg()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

     
    countSql = f"""
            SELECT {selectedVariable}, count(1) as "Total"
            FROM avl_modeler_senarios.senario_{senarioId}_trips
            where {selectedVariable} = '{selectedMetaKey}'
            group by {selectedVariable}
             """
    cursor.execute(countSql)
    trip = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(trip)


# @app.route('/senarios/<senarioId>/<selectedTazVariable>/<selectedMetaVariable>/<metaKey>/<selectedBlockGroups>/trip')
# def tripsBySenarioOriginPurpose(senarioId, selectedTazVariable, selectedMetaVariable, metaKey, selectedBlockGroups):
#     conn = get_db_connection_pg()
#     cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
     
#     #  find tazId using selectedBlockGroups
#     tazId = "41"



    
#     reverseSelectedTazVariable = "destination" if selectedTazVariable == "origin" else "origin"


#     countSql = f"""
#         SELECT 
#             {selectedTazVariable} as "TAZ",
#             COUNT(1) as count
#         FROM avl_modeler_senarios.senario_{senarioId}_trips
#         WHERE 
#             {reverseSelectedTazVariable} = %s AND 
#             {selectedMetaVariable} = %s
#         GROUP BY {selectedTazVariable}
#         ORDER BY count DESC
#     """
    
#     cursor.execute(countSql, (tazId, metaKey))
#     trip_counts = cursor.fetchall()
    
#     cursor.close()
#     conn.close()

#     return jsonify(trip_counts)

# @app.route('/senarios/<senarioId>/<projectId>/<selectedTazVariable>/<selectedMetaVariable>/<metaKey>/<selectedBlockGroups>/trip')
# def tripsBySenarioOriginPurpose(senarioId, projectId, selectedTazVariable, selectedMetaVariable, metaKey, selectedBlockGroups):
#     conn = get_db_connection_pg()
#     cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

#     # Find the TAZ ID using selectedBlockGroups 
#     bg_to_taz_sql = f"""
#         SELECT "TAZ"
#         FROM avl_modeler_projects.project_{projectId}_households
#         WHERE "BG" = %s::text
#     """
#     cursor.execute(bg_to_taz_sql, (selectedBlockGroups,))
#     taz_result = cursor.fetchone()
#     tazId = taz_result['TAZ'] if taz_result else None

#     if tazId is None:
#         cursor.close()
#         conn.close()
#         return jsonify({"error": "No TAZ ID found for the selected block group"}), 404

#     # Query modified trip counts with selected Meta
#     reverseSelectedTazVariable = "destination" if selectedTazVariable == "origin" else "origin"

#     # Cast tazId and metaKey to the correct type
#     countSql = f"""
#         SELECT 
#             {selectedTazVariable} as "TAZ",
#             COUNT(1) as count
#         FROM avl_modeler_senarios.senario_{senarioId}_trips
#         WHERE 
#             {reverseSelectedTazVariable} = %s::text AND 
#             {selectedMetaVariable} = %s::text
#         GROUP BY {selectedTazVariable}
#         ORDER BY count DESC
#     """

#     cursor.execute(countSql, (str(tazId), str(metaKey)))
#     trip_counts = cursor.fetchall()

#     cursor.close()
#     conn.close()
    
#     return jsonify(trip_counts)



# new updated route

# @app.route('/senarios/<senarioId>/<projectId>/<selectedTazVariable>/<selectedMetaVariable>/<metaKey>/<selectedBlockGroups>/trip')
# def tripsBySenarioOriginPurpose(senarioId, projectId, selectedTazVariable, selectedMetaVariable, metaKey, selectedBlockGroups):
#     conn = get_db_connection_pg()
#     cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

#     # Find the TAZ ID using selectedBlockGroups 
#     bg_to_taz_sql = f"""
#         SELECT "TAZ"
#         FROM avl_modeler_projects.project_{projectId}_households
#         WHERE "BG" = %s::text
#     """
#     cursor.execute(bg_to_taz_sql, (selectedBlockGroups,))
#     taz_result = cursor.fetchone()
#     tazId = taz_result['TAZ'] if taz_result else None

#     if tazId is None:
#         cursor.close()
#         conn.close()
#         return jsonify({"error": "No TAZ ID found for the selected block group"}), 404

#     # Query modified trip counts with selected Meta
#     reverseSelectedTazVariable = "destination" if selectedTazVariable == "origin" else "origin"

#     countSql = f"""
#         SELECT 
#             {selectedTazVariable} as "TAZ",
#             COUNT(1) as count
#         FROM avl_modeler_senarios.senario_{senarioId}_trips
#         WHERE 
#             {reverseSelectedTazVariable} = %s::text AND 
#             {selectedMetaVariable} = %s::text
#         GROUP BY {selectedTazVariable}
#         ORDER BY count DESC
#     """

#     cursor.execute(countSql, (str(tazId), str(metaKey)))
#     trip_counts = cursor.fetchall()

#     # Add 'bg' field to each entry in trip_counts as the last 7 characters of selectedBlockGroups
#     for trip in trip_counts:
#         trip['bg'] = selectedBlockGroups[-7:]  # Keep only the last 7 characters of selectedBlockGroups

#     cursor.close()
#     conn.close()
    
#     return jsonify(trip_counts)


# @app.route('/senarios/<senarioId>/<projectId>/<selectedTazVariable>/<selectedMetaVariable>/<metaKey>/<selectedBlockGroups>/trip')
# def tripsBySenarioOriginPurpose(senarioId, projectId, selectedTazVariable, selectedMetaVariable, metaKey, selectedBlockGroups):
#     conn = get_db_connection_pg()
#     cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

#     # Find TAZ ID using selectedBlockGroups
#     bg_to_taz_sql = f"""
#         SELECT "TAZ"
#         FROM avl_modeler_projects.project_{projectId}_households
#         WHERE "BG" = %s::text OR RIGHT("BG", 7) = %s
#     """
#     cursor.execute(bg_to_taz_sql, (selectedBlockGroups, selectedBlockGroups[-7:]))
#     taz_result = cursor.fetchone()

#     if not taz_result:
#         cursor.close()
#         conn.close()
#         return jsonify({"error": "No TAZ ID found for the selected block group"}), 404

#     tazId = taz_result['TAZ']

#     # Reverse selected TAZ variable
#     reverseSelectedTazVariable = "destination" if selectedTazVariable == "origin" else "origin"

#     # Query trip counts based on TAZ and Meta
#     countSql = f"""
#         SELECT 
#             {selectedTazVariable} as "TAZ",
#             COUNT(1) as "Total"
#         FROM avl_modeler_senarios.senario_{senarioId}_trips
#         WHERE 
#             {reverseSelectedTazVariable} = %s::text AND 
#             {selectedMetaVariable} = %s::text
#         GROUP BY {selectedTazVariable}
#         ORDER BY "Total" DESC
#     """
#     cursor.execute(countSql, (str(tazId), str(metaKey)))
#     trip_counts = cursor.fetchall()

#     # Retrieve the full 'BG' value for each TAZ in trip_counts
#     for trip in trip_counts:
#         taz_value = trip['TAZ']
#         bg_sql = f"""
#             SELECT "BG"
#             FROM avl_modeler_projects.project_{projectId}_households
#             WHERE "TAZ" = %s
#             LIMIT 1
#         """
#         cursor.execute(bg_sql, (taz_value,))
#         bg_result = cursor.fetchone()
#         if bg_result and bg_result['BG']:
#             trip['bg'] = bg_result['BG'][-7:]  # Keep only the last 7 characters of BG
#         else:
#             trip['bg'] = None

#     cursor.close()
#     conn.close()
    
#     return jsonify(trip_counts)






@app.route('/senarios/<senarioId>/<projectId>/<selectedTazVariable>/<selectedMetaVariable>/<metaKey>/<selectedBlockGroups>/trip')
def tripsBySenarioOriginPurpose(senarioId, projectId, selectedTazVariable, selectedMetaVariable, metaKey, selectedBlockGroups):
    conn = get_db_connection_pg()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # getting TAZ id based on selectedBlockGroups
    bg_to_taz_sql = f"""
        SELECT "TAZ"
        FROM avl_modeler_projects.project_{projectId}_landuse
        WHERE "BG" = %s
    """
    cursor.execute(bg_to_taz_sql, (selectedBlockGroups[-7:],))
    taz_result = cursor.fetchone()

    if not taz_result:
        cursor.close()
        conn.close()
        return jsonify({"No matching TAZ ID found for the selected block group"})

    tazId = taz_result['TAZ']

    # Reverse selected TAZ variable for direction
    reverseSelectedTazVariable = "destination" if selectedTazVariable == "origin" else "origin"

   
    countSql = f"""
        SELECT 
            t.{selectedTazVariable} as "TAZ",
            COUNT(1) as "Total",
            h."BG" as bg
        FROM avl_modeler_senarios.senario_{senarioId}_trips t
        JOIN avl_modeler_projects.project_{projectId}_landuse h 
        ON t.{selectedTazVariable}::text = h."TAZ"::text
        WHERE 
            t.{reverseSelectedTazVariable} = %s::text AND 
            t.{selectedMetaVariable} = %s::text
        GROUP BY t.{selectedTazVariable}, h."BG"
   
    """
    cursor.execute(countSql, (str(tazId), str(metaKey)))
    trip_counts = cursor.fetchall()

    cursor.close()
    conn.close()
    
    return jsonify(trip_counts)




@app.route('/senarios/<senarioId>/<projectId>/<selectedVariable>/trip')
def tripBySenarioProject(senarioId, projectId, selectedVariable):
    conn = get_db_connection_pg()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
   
    countSql = f"""
        SELECT {selectedVariable}  as "TAZ", count(1) as "Total"
        FROM avl_modeler_senarios.senario_{senarioId}_trips
        GROUP BY {selectedVariable}
    """
    
    cursor.execute(countSql)
    trip_counts = cursor.fetchall()

    # Add BG from household table for each destination
    for trip in trip_counts:
        selectedVariable = trip['TAZ']
        bgSql = f"""
            SELECT "BG"
            FROM avl_modeler_projects.project_{projectId}_households
            WHERE "TAZ" = {selectedVariable}::integer
            LIMIT 1
        """
        cursor.execute(bgSql)
        bg_result = cursor.fetchone()
        trip['bg'] = bg_result['BG'] if bg_result else None
    
    cursor.close()
    conn.close()
    return jsonify(trip_counts)


@app.route('/senarios/<senarioId>/<selectedVariable>/trips')
def tripCountsBySenario(senarioId, selectedVariable):
    conn = get_db_connection_pg()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
   
    countSql = f"""
            WITH trip_data AS (
                SELECT 
                    destination as "TAZ", 
                    {selectedVariable},
                    COUNT(*) as count
                FROM avl_modeler_senarios.senario_{senarioId}_trips
                GROUP BY destination, {selectedVariable}
            )
        SELECT 
            "TAZ",
            json_object_agg({selectedVariable}, count) as variable,
            SUM(count) as total_count
        FROM trip_data
        GROUP BY "TAZ"
        ORDER BY "TAZ" ASC
    """
    
    cursor.execute(countSql)
    trip_counts = cursor.fetchall()
    
    cursor.close()
    conn.close()

    # restructure the data
    processed_counts = []
    for item in trip_counts:
        new_item = {
            "TAZ": item["TAZ"],
            "total_count": str(item["total_count"])  
        }
        new_item.update(item["variable"])
        processed_counts.append(new_item)

    return jsonify(processed_counts)

@app.route('/senarios/<senarioId>/<projectId>/trip_overview')
def tripOverviewBySenarioProject(senarioId, projectId):
    conn = get_db_connection_pg()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
   
    # First, get the total count for each destination
    countSql = f"""
        SELECT destination as "TAZ", COUNT(1) as count
        FROM avl_modeler_senarios.senario_{senarioId}_trips
        GROUP BY destination
    """
    
    cursor.execute(countSql)
    trip_counts = cursor.fetchall()

    # Create a dictionary to store all information
    result = {trip['TAZ']: {'count': trip['count'], 'origins': {}, 'modes': {}} for trip in trip_counts}

    # Now, get the origin and mode breakdowns
    detailSql = f"""
        SELECT 
            destination as "TAZ", 
            origin,
            COUNT(1) as origin_count,
            trip_mode,
            COUNT(1) as mode_count
        FROM avl_modeler_senarios.senario_{senarioId}_trips
        GROUP BY destination, origin, trip_mode
    """
    
    cursor.execute(detailSql)
    trip_details = cursor.fetchall()

    # Process the details
    for detail in trip_details:
        taz = detail['TAZ']
        origin = detail['origin']
        mode = detail['trip_mode']

        result[taz]['origins'][origin] = detail['origin_count']
        result[taz]['modes'][mode] = detail['mode_count']

    # Add BG information
    for taz in result:
        bgSql = f"""
            SELECT "BG"
            FROM avl_modeler_projects.project_{projectId}_households
            WHERE "TAZ" = {taz}::integer
            LIMIT 1
        """
        cursor.execute(bgSql)
        bg_result = cursor.fetchone()
        result[taz]['bg'] = bg_result['BG'] if bg_result else None

    cursor.close()
    conn.close()

    # Convert the result dictionary to a list 
    final_result = [
        {
            'TAZ': taz,
            'bg': data['bg'],
            'count': data['count'],
            'origins': data['origins'],
            'modes': data['modes']
        }
        for taz, data in result.items()
    ]

    return jsonify(final_result)


@app.route('/network/<int:sourceid>/<int:targetid>')
def shortestNetwork(sourceid, targetid):
    conn = get_db_connection_pg_neptune()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    query = '''
    SELECT * FROM pgr_dijkstra(
        'SELECT id, source, target, cost, reverse_cost FROM avl_modeler_osm.nys_osm_roads_linestrings_noded',
        %s,
        %s,
        false
    )
    '''

    
    cursor.execute(query, (sourceid, targetid))
    status = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(status)



@app.route('/network/createskim', methods=['POST'])
def createskim_traveltime():
    conn = get_db_connection_pg_neptune()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Get bgIds and projectId from JSON request body{"text":"avl_modeler_osm","cur":{"from":15,"to":15}}
    data = request.get_json()
    bgIds = data.get('bgIds', [])
    projectId = data.get('projectId')

    if not bgIds or not projectId:
        return jsonify({"error": "No bgIds or projectId provided"}), 400

    bgIdsN = "'" + "','".join(bgIds) + "'"

    traveltime_sql = f'''
    CREATE TABLE avl_modeler_datasets.tl_2019_36_bg_network_{projectId} AS
        WITH RECURSIVE
        bg_nodes AS (
            SELECT geoid, node_id
            FROM avl_modeler_datasets.tl_2019_36_bg
            WHERE geoid IN ({bgIdsN})
        ),
        node_pairs AS (
            SELECT 
                a.geoid AS geoid_1,
                b.geoid AS geoid_2,
                a.node_id AS nodeid_1,
                b.node_id AS nodeid_2
            FROM bg_nodes AS a
            CROSS JOIN bg_nodes AS b
        ),
        dijkstra_result AS (
            SELECT *
            FROM pgr_dijkstraCostMatrix(
                'SELECT id, source, target, cost, reverse_cost FROM avl_modeler_osm.nys_osm_roads_linestrings_noded',
                (SELECT array_agg(DISTINCT node_id) FROM bg_nodes)
            )
        )
        SELECT 
            np.geoid_1,
            np.geoid_2,
            np.nodeid_1,
            np.nodeid_2,
            COALESCE(dr.agg_cost, 0) AS agg_cost
        FROM node_pairs AS np
        LEFT JOIN dijkstra_result AS dr ON np.nodeid_1 = dr.start_vid AND np.nodeid_2 = dr.end_vid
        ORDER BY np.geoid_1, np.geoid_2;
    '''

    try:
        cursor.execute(traveltime_sql)
        conn.commit()
    
    #   Call matrix_omx_tt
        matrix_omx_tt(projectId)
  

        return jsonify({"message": f"Table tl_2019_36_bg_network_{projectId} created successfully"}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# def matrix_omx_tt(projectId):
#     conn = get_db_connection_pg_neptune()
#     cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

#     try:
#         query = f'''
#         SELECT geoid_1, geoid_2, agg_cost as traveltime
#         FROM avl_modeler_datasets.tl_2019_36_bg_network_{projectId} 
#         '''

#         cur.execute(query)
#         traveltime_output = cur.fetchall()
        
#         print("traveltime_output---", traveltime_output[:10])

#         geoid_1 = np.unique([d['geoid_1'] for d in traveltime_output])
#         geoid_2 = np.unique([d['geoid_2'] for d in traveltime_output])

#         traveltimeTable = np.ones((len(geoid_1), len(geoid_2)))
#         eaTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
#         amTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
#         mdTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
#         pmTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
#         evTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))

#         for d in traveltime_output:
#             i = np.where(geoid_1 == d['geoid_1'])[0][0]
#             j = np.where(geoid_2 == d['geoid_2'])[0][0]

#             traveltimeTable[i, j] = d['traveltime']
#             eaTravelTimeTable[i, j] = d['traveltime']
#             amTravelTimeTable[i, j] = d['traveltime']*1.8
#             mdTravelTimeTable[i, j] = d['traveltime']
#             pmTravelTimeTable[i, j] = d['traveltime']*1.7
#             evTravelTimeTable[i, j] = d['traveltime']*1.2

#         cwdpath = os.getcwd()
#         print("The current working directory is %s" % cwdpath)

#         parent_dir = os.getcwd() + '/popsynth_runs/'
#         directory = str(projectId)
#         folder = os.path.join(parent_dir, directory)


#     #   creating tt skim

#         # full_path = folder + '/output/activitysim_input/ttskims.omx'
#         # dir_path = os.path.dirname(full_path)
#         # if not os.path.exists(dir_path):
#         #     print(f"Directory does not exist: {dir_path}")
#         #     os.makedirs(dir_path, exist_ok=True)
#         #     print(f"Created directory: {dir_path}")

#         # if not os.access(dir_path, os.W_OK):
#         #     print(f"No write permission for directory: {dir_path}")
#         #     raise PermissionError(f"No write permission for directory: {dir_path}")
    
#         # ttskims = omx.open_file(full_path, 'w')

#         ttskims = omx.open_file('popsynth_runs/test_prototype_mtc_new/data/skims.omx', 'w')

#         ttskims['TravelTime'] = traveltimeTable
       

 
#         prototype_skims = omx.open_file('popsynth_runs/test_prototype_mtc/data/skims.omx')

#         table_names_list = prototype_skims.list_matrices()

#         for name in table_names_list:
#             if "EA" in name:
#                 if any(x in name for x in ["SOV", "HOV"]):
#                     ttskims[name] = eaTravelTimeTable
#                 elif "WLK" in name:
#                     ttskims[name] = eaTravelTimeTable * 2
#                 else:
#                     ttskims[name] = eaTravelTimeTable*10
#             elif "AM" in name:
#                 if any(x in name for x in ["SOV", "HOV"]):
#                     ttskims[name] = amTravelTimeTable
#                 elif "WLK" in name:
#                     ttskims[name] = amTravelTimeTable * 2
#                 else:
#                     ttskims[name] = amTravelTimeTable*10
#             elif "MD" in name:
#                 if any(x in name for x in ["SOV", "HOV"]):
#                     ttskims[name] = mdTravelTimeTable

#                 elif "WLK" in name:
#                     ttskims[name] = mdTravelTimeTable * 2
#                 else:
#                     ttskims[name] = mdTravelTimeTable*10
#             elif "PM" in name:
#                 if any(x in name for x in ["SOV", "HOV"]):
#                     ttskims[name] = pmTravelTimeTable

#                 elif "WLK" in name:
#                     ttskims[name] = pmTravelTimeTable * 2
#                 else:
#                     ttskims[name] = pmTravelTimeTable*10
#             elif "EV" in name:
#                 if any(x in name for x in ["SOV", "HOV"]):
#                     ttskims[name] = evTravelTimeTable
#                 elif "WLK" in name:
#                     ttskims[name] = evTravelTimeTable * 2
#                 else:
#                     ttskims[name] = evTravelTimeTable*10
#             elif "DISTBIKE" in name:
#                 ttskims[name] = traveltimeTable * 3
#             elif "DISTWALK" in name:
#                 ttskims[name] = traveltimeTable * 10
#             else:
#                 ttskims[name] = traveltimeTable

#         prototype_skims.close()
#         ttskims.close()

#         print("OMX file created successfully")

#     except Exception as e:
#         print(f"Error in matrix_omx_tt: {str(e)}")
#         raise
#     finally:
#         cur.close()
#         conn.close()

#  # version 2
# def matrix_omx_tt(projectId):
#     conn = get_db_connection_pg_neptune()
#     cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

#     try:
#         query = f'''
#         SELECT geoid_1, geoid_2, agg_cost as traveltime
#         FROM avl_modeler_datasets.tl_2019_36_bg_network_{projectId} 
#         '''

#         cur.execute(query)
#         traveltime_output = cur.fetchall()
        
#         print("traveltime_output---", traveltime_output[:10])

#         geoid_1 = np.unique([d['geoid_1'] for d in traveltime_output])
#         geoid_2 = np.unique([d['geoid_2'] for d in traveltime_output])

#         traveltimeTable = np.ones((len(geoid_1), len(geoid_2)))
#         eaTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
#         amTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
#         mdTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
#         pmTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
#         evTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))

#         for d in traveltime_output:
#             i = np.where(geoid_1 == d['geoid_1'])[0][0]
#             j = np.where(geoid_2 == d['geoid_2'])[0][0]

#             traveltimeTable[i, j] = d['traveltime']
#             eaTravelTimeTable[i, j] = d['traveltime']
#             amTravelTimeTable[i, j] = d['traveltime']*1.8
#             mdTravelTimeTable[i, j] = d['traveltime']
#             pmTravelTimeTable[i, j] = d['traveltime']*1.7
#             evTravelTimeTable[i, j] = d['traveltime']*1.2

#         cwdpath = os.getcwd()
#         print("The current working directory is %s" % cwdpath)

#         parent_dir = os.getcwd() + '/popsynth_runs/'
#         directory = str(projectId)
#         folder = os.path.join(parent_dir, directory)



#         ttskims = omx.open_file('popsynth_runs/test_prototype_mtc_new/data/skims.omx', 'w')

#         ttskims['TravelTime'] = traveltimeTable
       

 
#         prototype_skims = omx.open_file('popsynth_runs/test_prototype_mtc/data/skims.omx')

#         table_names_list = prototype_skims.list_matrices()

#         for name in table_names_list:
#             if "EA" in name:
#                 if any(x in name for x in ["SOV", "HOV"]):
#                     ttskims[name] = eaTravelTimeTable
#                 elif "WLK" in name:
#                     ttskims[name] = eaTravelTimeTable *1000
#                 else:
#                     ttskims[name] = eaTravelTimeTable*100
#             elif "AM" in name:
#                 if any(x in name for x in ["SOV", "HOV"]):
#                     ttskims[name] = amTravelTimeTable
#                 elif "WLK" in name:
#                     ttskims[name] = amTravelTimeTable * 1000
#                 else:
#                     ttskims[name] = amTravelTimeTable*100
#             elif "MD" in name:
#                 if any(x in name for x in ["SOV", "HOV"]):
#                     ttskims[name] = mdTravelTimeTable

#                 elif "WLK" in name:
#                     ttskims[name] = mdTravelTimeTable * 1000
#                 else:
#                     ttskims[name] = mdTravelTimeTable*100
#             elif "PM" in name:
#                 if any(x in name for x in ["SOV", "HOV"]):
#                     ttskims[name] = pmTravelTimeTable

#                 elif "WLK" in name:
#                     ttskims[name] = pmTravelTimeTable * 1000
#                 else:
#                     ttskims[name] = pmTravelTimeTable*100
#             elif "EV" in name:
#                 if any(x in name for x in ["SOV", "HOV"]):
#                     ttskims[name] = evTravelTimeTable
#                 elif "WLK" in name:
#                     ttskims[name] = evTravelTimeTable * 1000
#                 else:
#                     ttskims[name] = evTravelTimeTable*100
#             elif "DISTBIKE" in name:
#                 ttskims[name] = traveltimeTable 
#             elif "DISTWALK" in name:
#                 ttskims[name] = traveltimeTable
#             elif "BOARDS" in name:
#                     ttskims[name] = 1
#             else:
#                 ttskims[name] = traveltimeTable

#         prototype_skims.close()
#         ttskims.close()

#         print("OMX file created successfully")

#     except Exception as e:
#         print(f"Error in matrix_omx_tt: {str(e)}")
#         raise
#     finally:
#         cur.close()
#         conn.close()


# # verson 3
# def matrix_omx_tt(projectId):
#     conn = get_db_connection_pg_neptune()
#     cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

#     try:
#         query = f'''
#         SELECT geoid_1, geoid_2, agg_cost as traveltime
#         FROM avl_modeler_datasets.tl_2019_36_bg_network_{projectId} 
#         '''

#         cur.execute(query)
#         traveltime_output = cur.fetchall()
        
#         print("traveltime_output---", traveltime_output[:10])

#         geoid_1 = np.unique([d['geoid_1'] for d in traveltime_output])
#         geoid_2 = np.unique([d['geoid_2'] for d in traveltime_output])

#         traveltimeTable = np.ones((len(geoid_1), len(geoid_2)))
#         eaTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
#         amTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
#         mdTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
#         pmTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
#         evTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))

#         for d in traveltime_output:
#             i = np.where(geoid_1 == d['geoid_1'])[0][0]
#             j = np.where(geoid_2 == d['geoid_2'])[0][0]

#             traveltimeTable[i, j] = d['traveltime']
#             eaTravelTimeTable[i, j] = d['traveltime']
#             amTravelTimeTable[i, j] = d['traveltime']*1.8
#             mdTravelTimeTable[i, j] = d['traveltime']
#             pmTravelTimeTable[i, j] = d['traveltime']*1.7
#             evTravelTimeTable[i, j] = d['traveltime']*1.2

#         cwdpath = os.getcwd()
#         print("The current working directory is %s" % cwdpath)

#         parent_dir = os.getcwd() + '/popsynth_runs/'
#         directory = str(projectId)
#         folder = os.path.join(parent_dir, directory)



#         ttskims = omx.open_file('popsynth_runs/test_prototype_mtc_new/data/skims.omx', 'w')

#         ttskims['TravelTime'] = traveltimeTable
       

 
#         prototype_skims = omx.open_file('popsynth_runs/test_prototype_mtc/data/skims.omx')

#         table_names_list = prototype_skims.list_matrices()

#         for name in table_names_list:
#             if "EA" in name:
#                 if any(x in name for x in ["SOV", "HOV"]):
#                     ttskims[name] = eaTravelTimeTable
#                 elif "WLK" in name:
#                     ttskims[name] = eaTravelTimeTable *1000
#                 else:
#                     ttskims[name] = eaTravelTimeTable*100
#             elif "AM" in name:
#                 if any(x in name for x in ["SOV", "HOV"]):
#                     ttskims[name] = amTravelTimeTable
#                 elif "WLK" in name:
#                     ttskims[name] = amTravelTimeTable * 1000
#                 else:
#                     ttskims[name] = amTravelTimeTable*100
#             elif "MD" in name:
#                 if any(x in name for x in ["SOV", "HOV"]):
#                     ttskims[name] = mdTravelTimeTable

#                 elif "WLK" in name:
#                     ttskims[name] = mdTravelTimeTable * 1000
#                 else:
#                     ttskims[name] = mdTravelTimeTable*100
#             elif "PM" in name:
#                 if any(x in name for x in ["SOV", "HOV"]):
#                     ttskims[name] = pmTravelTimeTable

#                 elif "WLK" in name:
#                     ttskims[name] = pmTravelTimeTable * 1000
#                 else:
#                     ttskims[name] = pmTravelTimeTable*100
#             elif "EV" in name:
#                 if any(x in name for x in ["SOV", "HOV"]):
#                     ttskims[name] = evTravelTimeTable
#                 elif "WLK" in name:
#                     ttskims[name] = evTravelTimeTable * 1000
#                 else:
#                     ttskims[name] = evTravelTimeTable*100
#             elif "DISTBIKE" in name:
#                 ttskims[name] = traveltimeTable 
#             elif "DISTWALK" in name:
#                 ttskims[name] = traveltimeTable

#             elif "XWAIT" in name:
#                 ttskims[name] = np.zeros_like(traveltimeTable)
#             elif "WAUX" in name:
#                 if "COM" in name:
#                     ttskims[name] = np.full_like(traveltimeTable, 300.0)
#                 else:
#                     ttskims[name] = np.zeros_like(traveltimeTable)
#             elif "BTOLL" in name:
#                 ttskims[name] = np.full_like(traveltimeTable, 134.0)
#             elif "VTOLL" in name:
#                 ttskims[name] = np.zeros_like(traveltimeTable)
#             elif "DIST" in name:
#                 if any(x in name for x in ["WALK", "BIKE"]):
#                     ttskims[name] = np.full_like(traveltimeTable, 0.01)
#                 else:
#                     ttskims[name] = np.full_like(traveltimeTable, 0.0102)
#             elif "DDIST" in name:
#                 if "EA" in name or "EV" in name:
#                     ttskims[name] = np.full_like(traveltimeTable, 8.35)
#                 elif "AM" in name:
#                     ttskims[name] = np.full_like(traveltimeTable, 8.47)
#                 elif "MD" in name:
#                     ttskims[name] = np.full_like(traveltimeTable, 8.89)
#                 elif "PM" in name:
#                     ttskims[name] = np.full_like(traveltimeTable, 8.97)
#             elif "KEYIVT" in name:
#                 if "COM" in name:
#                     ttskims[name] = np.full_like(traveltimeTable, 18.9805)
#                 else:
#                     ttskims[name] = np.zeros_like(traveltimeTable)
#             elif "IWAIT" in name:
#                 if "AM" in name or "PM" in name:
#                     ttskims[name] = np.full_like(traveltimeTable, 1.5171)
#                 elif "EA" in name:
#                     ttskims[name] = np.full_like(traveltimeTable, 3.1642)
#                 elif "EV" in name:
#                     ttskims[name] = np.full_like(traveltimeTable, 2.6571)
#                 elif "MD" in name:
#                     ttskims[name] = np.full_like(traveltimeTable, 1.5471)

#             elif "BOARDS" in name:
#                 if "COM" in name:
#                     ttskims[name] = np.full_like(traveltimeTable, 2.0)
#                 else:
#                     ttskims[name] = np.full_like(traveltimeTable, 1.0)
#             elif "FAR" in name:
#                 if "EXP" in name:
#                     ttskims[name] = np.full_like(traveltimeTable, 139.0)
#                 elif "COM" in name:
#                     ttskims[name] = np.full_like(traveltimeTable, 221.0)
#                 elif "LOC" in name:
#                     ttskims[name] = np.full_like(traveltimeTable, 152.0)
#                 elif "HVY" in name:
#                     ttskims[name] = np.full_like(traveltimeTable, 220.0)
#             else:
#                 ttskims[name] = traveltimeTable

#         prototype_skims.close()
#         ttskims.close()

#         print("OMX file created successfully")

#     except Exception as e:
#         print(f"Error in matrix_omx_tt: {str(e)}")
#         raise
#     finally:
#         cur.close()
#         conn.close()

# version 4

def matrix_omx_tt(projectId):
    conn = get_db_connection_pg_neptune()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        query = f'''
        SELECT geoid_1, geoid_2, agg_cost as traveltime
        FROM avl_modeler_datasets.tl_2019_36_bg_network_{projectId} 
        '''

        cur.execute(query)
        traveltime_output = cur.fetchall()
        
        print("traveltime_output---", traveltime_output[:10])

        geoid_1 = np.unique([d['geoid_1'] for d in traveltime_output])
        geoid_2 = np.unique([d['geoid_2'] for d in traveltime_output])

        traveltimeTable = np.ones((len(geoid_1), len(geoid_2)))
        eaTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
        amTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
        mdTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
        pmTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
        evTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))

        for d in traveltime_output:
            i = np.where(geoid_1 == d['geoid_1'])[0][0]
            j = np.where(geoid_2 == d['geoid_2'])[0][0]

            traveltimeTable[i, j] = d['traveltime']
            eaTravelTimeTable[i, j] = d['traveltime']
            amTravelTimeTable[i, j] = d['traveltime']
            mdTravelTimeTable[i, j] = d['traveltime']
            pmTravelTimeTable[i, j] = d['traveltime']
            evTravelTimeTable[i, j] = d['traveltime']

        ttskims = omx.open_file('popsynth_runs/test_prototype_mtc_new/data/skims.omx', 'w')
        ttskims['TravelTime'] = traveltimeTable

        prototype_skims = omx.open_file('popsynth_runs/test_prototype_mtc/data/skims.omx')
        table_names_list = prototype_skims.list_matrices()

        for name in table_names_list:
            if "BOARDS" in name:
                ttskims[name] = np.full_like(traveltimeTable, 2.0 if "COM" in name else 1.0)
            elif "FAR" in name:
                if "EXP" in name or "LRF" in name:
                    ttskims[name] = np.full_like(traveltimeTable, 139.0)
                elif "COM" in name:
                    ttskims[name] = np.full_like(traveltimeTable, 221.0)
                elif "LOC" in name:
                    ttskims[name] = np.full_like(traveltimeTable, 152.0)
                elif "HVY" in name:
                    ttskims[name] = np.full_like(traveltimeTable, 220.0)
            elif "XWAIT" in name:
                ttskims[name] = np.zeros_like(traveltimeTable)
            elif "WAUX" in name:
                if "COM" in name:
                    ttskims[name] = np.full_like(traveltimeTable, 300.0)
                elif "HVY" in name:
                    ttskims[name] = np.full_like(traveltimeTable, 600.0)
                else:
                    ttskims[name] = np.zeros_like(traveltimeTable)
            elif "BTOLL" in name:
                ttskims[name] = np.full_like(traveltimeTable, 134.0)
            elif "VTOLL" in name:
                ttskims[name] = np.zeros_like(traveltimeTable)
            elif "DIST" in name or "DDIST" in name:
                if "WALK" in name or "BIKE" in name:
                    ttskims[name] = np.full_like(traveltimeTable, 0.01)
                else:
                    ttskims[name] = np.full_like(traveltimeTable, 0.0102)
            elif "KEYIVT" in name:
                if "COM" in name or "HVY" in name:
                    ttskims[name] = np.full_like(traveltimeTable, 18.9805)
                else:
                    ttskims[name] = np.zeros_like(traveltimeTable)
            elif "IWAIT" in name:
                if "AM" in name or "PM" in name:
                    ttskims[name] = np.full_like(traveltimeTable, 1.5171)
                elif "EA" in name:
                    ttskims[name] = np.full_like(traveltimeTable, 3.1642)
                elif "EV" in name:
                    ttskims[name] = np.full_like(traveltimeTable, 2.6571)
                elif "MD" in name:
                    ttskims[name] = np.full_like(traveltimeTable, 1.5471)
            elif "EA" in name:
                if any(x in name for x in ["SOV", "HOV"]):
                    ttskims[name] = eaTravelTimeTable
                elif "WLK" in name:
                    ttskims[name] = eaTravelTimeTable * 2
                else:
                    ttskims[name] = eaTravelTimeTable*10
            elif "AM" in name:
                if any(x in name for x in ["SOV", "HOV"]):
                    ttskims[name] = amTravelTimeTable
                elif "WLK" in name:
                    ttskims[name] = amTravelTimeTable * 2
                else:
                    ttskims[name] = amTravelTimeTable*10
            elif "MD" in name:
                if any(x in name for x in ["SOV", "HOV"]):
                    ttskims[name] = mdTravelTimeTable

                elif "WLK" in name:
                    ttskims[name] = mdTravelTimeTable * 2
                else:
                    ttskims[name] = mdTravelTimeTable*10
            elif "PM" in name:
                if any(x in name for x in ["SOV", "HOV"]):
                    ttskims[name] = pmTravelTimeTable

                elif "WLK" in name:
                    ttskims[name] = pmTravelTimeTable * 2
                else:
                    ttskims[name] = pmTravelTimeTable*10
            elif "EV" in name:
                if any(x in name for x in ["SOV", "HOV"]):
                    ttskims[name] = evTravelTimeTable
                elif "WLK" in name:
                    ttskims[name] = evTravelTimeTable * 2
                else:
                    ttskims[name] = evTravelTimeTable*10
            else:
                ttskims[name] = traveltimeTable

        prototype_skims.close()
        ttskims.close()

        print("OMX file created successfully")

    except Exception as e:
        print(f"Error in matrix_omx_tt: {str(e)}")
        raise
    finally:
        cur.close()
        conn.close()



@app.route('/omx_to_csv/<project_id>')
def omx_to_csv(project_id):
    try:
        # Open the OMX file
        omx_file = omx.open_file('popsynth_runs/test_prototype_mtc/data/skims.omx', 'r')
        
        # Get list of all matrices
        matrix_names = omx_file.list_matrices()
        
        # Create output directory if it doesn't exist
        parent_dir = os.getcwd() + '/popsynth_runs/'
        project_folder = os.path.join(parent_dir, str(project_id))
        csv_folder = os.path.join(project_folder, 'skims_csv')
        os.makedirs(csv_folder, exist_ok=True)
        
        # Convert each matrix to CSV
        for matrix_name in matrix_names:
            # Get the matrix data
            matrix_data = omx_file[matrix_name]
            
            # Convert to pandas DataFrame
            df = pd.DataFrame(matrix_data)
            
            # Save to CSV
            csv_path = os.path.join(csv_folder, f'{matrix_name}.csv')
            df.to_csv(csv_path, index=True)
            
        omx_file.close()
        
        return jsonify({
            "message": "OMX file successfully converted to CSV",
            "output_directory": csv_folder,
            "matrices_converted": matrix_names
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "Failed to convert OMX file to CSV"
        }), 500


@app.route('/create_table_names_csv/<project_id>')
def create_table_names_csv(project_id):
    try:
        parent_dir = os.getcwd() + '/popsynth_runs/'
        project_folder = os.path.join(parent_dir, str(project_id))
        input_omx_path = 'popsynth_runs/test_prototype_mtc/data/skims.omx'
        csv_file_path = os.path.join(project_folder, 'table_names_list.csv')

        # Open the OMX file and get the table names
        with omx.open_file(input_omx_path, 'r') as prototype_skims:
            table_names_list = prototype_skims.list_matrices()

        # Ensure the project folder exists
        os.makedirs(project_folder, exist_ok=True)

        # Write the table names to a CSV file
        with open(csv_file_path, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Table Names'])  # Header
            for name in table_names_list:
                writer.writerow([name])

        print(f"Table names list saved to {csv_file_path}")
        return csv_file_path

    except Exception as e:
        print(f"Error in create_table_names_csv: {str(e)}")
        raise



@app.route('/process_csv_files/<project_id>')
def process_csv_files(project_id):
    results = {}

    parent_dir = os.getcwd() + '/popsynth_runs/'
    project_folder = os.path.join(parent_dir, str(project_id))
    directory = os.path.join(project_folder, 'skims_csv')

    

    for filename in os.listdir(directory):
        if filename.endswith('.csv'):
            file_path = os.path.join(directory, filename)
            df = pd.read_csv(file_path)
            
            # Remove the file extension from the name
            table_name = os.path.splitext(filename)[0]
            
            # Calculate a representative value based on the table type
            if 'DIST' in table_name or 'DDIST' in table_name:
                value = np.median(df.values.flatten()) / 100  # Convert to miles
            elif 'TIME' in table_name or 'IVT' in table_name or 'WAIT' in table_name:
                value = np.median(df.values.flatten()) / 100  # Convert to minutes
            elif 'TOLL' in table_name or 'FAR' in table_name:
                value = np.median(df.values.flatten())  # Keep as cents
            elif 'BOARDS' in table_name:
                value = np.median(df.values.flatten())  # Keep as is
            else:
                value = np.median(df.values.flatten())  # Default to median
            
            results[table_name] = value
    
    return results



@app.route('/insert_csv_psql/')
def insert_senario_run():

    parent_dir = os.getcwd() + '/popsynth_runs/test_prototype_mtc_original/'

    df_trips = pd.read_csv(parent_dir + '/output/final_trips.csv', sep=',',
                             error_bad_lines=False, index_col=False, dtype='unicode')

    engine = create_engine('postgresql+psycopg2://dama_dev_user:57e5b991-630f-4ca8-8078-f552744a2cf1@mercury.availabs.org:5532/kari')

    # Drop data into database
    df_trips.to_sql(f"prototype_mtc_senario_trips", engine, schema='avl_modeler_senarios', if_exists='replace', index=False)


    return "orignalActivitySim trips table succeefully inserted to database"





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

    # query = '''
    # WITH nearest_vertex AS (
    #     SELECT id, the_geom
    #     FROM avl_modeler_osm.nys_osm_roads_linestrings_noded_vertices_pgr
    #     ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint(%s, %s), 4326)
    #     LIMIT 1
    #     )
    # SELECT DISTINCT v.id, v.the_geom
    #     FROM nearest_vertex v
    #     JOIN avl_modeler_osm.nys_osm_roads_linestrings_noded e
    #     ON e.source = v.id OR e.target = v.id;
    # '''


  
    cursor.execute(query, (lng, lat))
    status = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(status)




