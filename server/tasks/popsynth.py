#from sim_settings.settings import models
#from activitysim.core import pipeline
from activitysim.cli.run import run
from populationsim import steps
from redis import Redis
from rq import Queue
import rq
import sqlite3
from sqlite3 import Error
import pandas as pd
import shutil
import os

import openmatrix as omx
import numpy as np

import pandas as pd
import csv
import random
import subprocess
# from odo import odo
import psycopg2
import psycopg2.extras
from sqlalchemy import create_engine



# import psycopg2


queue = rq.Queue('rq_popsynth', connection=Redis(), default_timeout=600)
# s_queue =rq.Queue('rq_activitysim', connection=Redis())


def get_db_connection():
    conn = sqlite3.connect('database/activitysimserver.sqlite')
    conn.row_factory = row_to_dict
    return conn

def row_to_dict(cursor: sqlite3.Cursor, row: sqlite3.Row) -> dict:
    data = {}
    for idx, col in enumerate(cursor.description):
        data[col[0]] = row[idx]
    return data


def get_db_connection_pg():
    conn = psycopg2.connect(
                        database="kari", 
                        user="dama_dev_user", 
                        password="57e5b991-630f-4ca8-8078-f552744a2cf1", 
                        host="mercury.availabs.org", port="5532"
                        )
    return conn


def run_senario(args, project_id, senario_id):
    print('Starting activitysim run')
    print('activitysim run args test', args)
    # run(args)

    try:
        # folder_path = args.working_dir
        # os.chdir(os.path.expanduser(folder_path))

        folder_path = args.working_dir
        os.chdir(folder_path)
        
        # # Run the activitysim command
        # maybe better modify -d data to the activiysim input from popsynth output folder
        command = "activitysim run -c configs -d data -o output"
        subprocess.run(command, shell=True, capture_output=True, text=True)
        # result = subprocess.run(command, shell=True, capture_output=True, text=True )


        job = queue.enqueue('tasks.popsynth.load_senario_run',
                            folder_path, project_id, senario_id, job_timeout=3600)

       

        print('Task completed')
        return "activitySim run successful"
        
    except Exception as e:
        print(f'Exception occurred: {e}')


        con = get_db_connection_pg()
        cur = con.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        status = "failed"
        # cur = con.cursor()
        cur.execute('''UPDATE avl_modeler_datasets.senarios SET status = %s WHERE id = %s''',
                    (status, senario_id))

        con.commit()
        con.close()

    #   return "failed status inserted"
        print('activitysim run failed')


def load_senario_run(folder, project_id, senario_id):

    # load activitysim data to sqlite

    print("path", folder + 'output')

    df_trips = pd.read_csv(folder + '/output/final_trips.csv', sep=',',
                             error_bad_lines=False, index_col=False, dtype='unicode')

    df_persons = pd.read_csv(folder + '/output/final_persons.csv', sep=',',
                             error_bad_lines=False, index_col=False, dtype='unicode')

    df_households = pd.read_csv(folder + '/output/final_households.csv', sep=',',
                                error_bad_lines=False, index_col=False, dtype='unicode')

    df_landuse = pd.read_csv(folder + '/output/final_land_use.csv', sep=',',
                                  error_bad_lines=False, index_col=False, dtype='unicode')
    
    
    print ("load_senario_run_ids", project_id, senario_id)
    


    engine = create_engine('postgresql+psycopg2://dama_dev_user:57e5b991-630f-4ca8-8078-f552744a2cf1@mercury.availabs.org:5532/kari')

    # Drop data into database
    df_trips.to_sql(f"senario_{senario_id}_trips", engine, schema='avl_modeler_senarios', if_exists='replace', index=False)
    df_persons.to_sql(f"senario_{senario_id}_persons", engine, schema='avl_modeler_senarios', if_exists='replace', index=False)
    df_households.to_sql(f"senario_{senario_id}_households", engine, schema='avl_modeler_senarios', if_exists='replace', index=False)
    df_landuse.to_sql(f"senario_{senario_id}_landuse", engine, schema='avl_modeler_senarios', if_exists='replace', index=False)



   # Update status in project table



    # update status in senario table
    status = "complete"
    con = get_db_connection_pg()
    cur = con.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    senario_id = int(senario_id)
    project_id = int(project_id)

    cur.execute('''UPDATE avl_modeler_datasets.senarios SET status = %s WHERE id = %s AND project_id = %s''', (status, senario_id, project_id))
    cur.execute('''SELECT status FROM avl_modeler_datasets.senarios WHERE id = %s AND project_id = %s''', (senario_id, project_id))

    # print("senario Table's status: ")
    # for row in cur.fetchall():
    #     print("senario status of", project_id, "_", senario_id, "is", row[0])

    con.commit()
    cur.close()
    con.close()


    return "activitySim outputs succeefully inserted to database"


def run_popsynth(args, project_id, selectedBGs):
    print('Starting task')
    print('task args test', args)
    try:
        run(args)
        job = queue.enqueue('tasks.popsynth.load_popsynth_run',
                            args.working_dir, project_id, selectedBGs)
        print('Task completed')
        
    except Exception as e:
        # this code currently never runs because run function doesn't raise exception on failure
        # insert failed project status into database

        print(f'run_popsynth Error: {e}')
        con = get_db_connection_pg()
        cur = con.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        status = "failed"
        
        cur.execute('''UPDATE avl_modeler_datasets.projects SET status = %s WHERE id = %s''',
                    (status, project_id))

        con.commit()
        cur.close()
        con.close()

        #   return "failed status inserted"
        print('PopSynth run failed')




def load_popsynth_run(folder, project_id, selectedBGs):
    print('load popsynth from folder', folder)

    # Update the projects status to loading
    print("path", folder + '/output')

    # Load data
    df_datadic = pd.read_csv(folder + '/output/data_dict.csv', sep=',',
                             index_col=False, dtype='unicode')

    df_persons = pd.read_csv(folder + '/output/synthetic_persons.csv', sep=',',
                             index_col=False, dtype='unicode')

    df_households = pd.read_csv(folder + '/output/synthetic_households.csv', sep=',',
                                index_col=False, dtype='unicode')

    df_geocrosswalk = pd.read_csv(folder + '/data/geo_cross_walk.csv', sep=',',
                                  index_col=False, dtype='unicode')

    # Strip whitespace from headers
    df_datadic.columns = df_datadic.columns.str.strip()
    df_persons.columns = df_persons.columns.str.strip()
    df_households.columns = df_households.columns.str.strip()
    df_geocrosswalk.columns = df_geocrosswalk.columns.str.strip()

    # Create a connection to PostgreSQL using SQLAlchemy
    engine = create_engine('postgresql+psycopg2://dama_dev_user:57e5b991-630f-4ca8-8078-f552744a2cf1@mercury.availabs.org:5532/kari')

    # Drop data into database
    df_datadic.to_sql(f"project_{project_id}_datadict", engine, schema='avl_modeler_projects', if_exists='replace', index=False)
    df_persons.to_sql(f"project_{project_id}_persons", engine, schema='avl_modeler_projects', if_exists='replace', index=False)
    df_households.to_sql(f"project_{project_id}_households", engine, schema='avl_modeler_projects', if_exists='replace', index=False)
    df_geocrosswalk.to_sql(f"project_{project_id}_geocrosswalk", engine, schema='avl_modeler_projects', if_exists='replace', index=False)


    # Update status in project table
    status = "complete"
    con = get_db_connection_pg()
    cur = con.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute('''UPDATE avl_modeler_datasets.projects SET status = %s WHERE id = %s''', (status, project_id))

    print("project Table's status: ")
    cur.execute('''SELECT status FROM avl_modeler_datasets.projects where id = %s''', (project_id,))
    for row in cur.fetchall():
        print("project status of", project_id, "is", row['status'])

    con.commit()
    cur.close()
    con.close()

    # Delete local folder (if needed)
    # shutil.rmtree(folder)

    # Call create_landuse
    create_landuse_table(project_id, selectedBGs, folder)

    return "{\"response\": \"success inserting datadict,person,households,geocrosswalk\"}"



#  create landuse table in sqldb


def create_landuse_table(project_id, selectedBGs, folder):
    con = get_db_connection_pg()
    cur = con.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    # cur = con.cursor()

    
    # cur.execute(f'''
    #         CREATE TABLE avl_modeler_projects.project_{project_id}_landuse AS
    #         SELECT 
    #             ROW_NUMBER() OVER (ORDER BY "BG") AS "TAZ",
    #             "BG" AS "BG",
    #             "TRACT" AS "DISTRICT",
    #             "TRACT" AS "SD",
    #             "TRACT" AS "COUNTY",
    #             COALESCE(count(DISTINCT "household_id"), 0) AS "TOTHH",
    #             COALESCE(count(1), 0) AS "TOTPOP",
    #             100 AS "TOTACRE", -- will need to join on spatial data
    #             70 AS "RESACRE", 
    #             30 AS "CIACRE",
    #             COALESCE(SUM(CASE WHEN "ESR" IS NULL THEN 0 ELSE 1 END), 0) AS "TOTEMP",
    #             COALESCE(SUM(CASE WHEN ("AGEP" ~ '^\d+(\.\d+)?$' AND CAST("AGEP"::numeric AS INTEGER) < 19 AND CAST("AGEP"::numeric AS INTEGER) >= 5) THEN 1 ELSE 0 END), 0) AS "AGE0519",
    #             COALESCE(SUM(CASE WHEN ("ESR" ~ '^\d+(\.\d+)?$' AND CAST("ESR"::numeric AS INTEGER) = 1) THEN 1 ELSE 0 END), 0) AS "RETEMPN",
    #             COALESCE(SUM(CASE WHEN ("ESR" ~ '^\d+(\.\d+)?$' AND CAST("ESR"::numeric AS INTEGER) = 2) THEN 1 ELSE 0 END), 0) AS "FPSEMPN",
    #             COALESCE(SUM(CASE WHEN ("ESR" ~ '^\d+(\.\d+)?$' AND CAST("ESR"::numeric AS INTEGER) = 3) THEN 1 ELSE 0 END), 0) AS "HEREMPN",
    #             COALESCE(SUM(CASE WHEN ("ESR" ~ '^\d+(\.\d+)?$' AND CAST("ESR"::numeric AS INTEGER) = 6) THEN 1 ELSE 0 END), 0) AS "OTHEMPN",
    #             COALESCE(SUM(CASE WHEN ("ESR" ~ '^\d+(\.\d+)?$' AND CAST("ESR"::numeric AS INTEGER) = 4) THEN 1 ELSE 0 END), 0) AS "AGREMPN",
    #             COALESCE(SUM(CASE WHEN ("ESR" ~ '^\d+(\.\d+)?$' AND CAST("ESR"::numeric AS INTEGER) = 5) THEN 1 ELSE 0 END), 0) AS "MWTEMPN",
    #             5 AS "PRKCST",
    #             10 AS "OPRKCST",
    #             0 AS "area_type",
    #             COALESCE(SUM(CASE WHEN ("SCHG" ~ '^\d+(\.\d+)?$' AND CAST("SCHG"::numeric AS INTEGER) < 15 AND CAST("SCHG"::numeric AS INTEGER) >= 11) THEN 1 ELSE 0 END), 0) AS "HSENROLL",
    #             COALESCE(SUM(CASE WHEN ("SCHG" ~ '^\d+(\.\d+)?$' AND CAST("SCHG"::numeric AS INTEGER) < 15 AND CAST("SCHG"::numeric AS INTEGER) >= 11 AND CAST("WKHP"::numeric AS INTEGER) >= 30) THEN 1 ELSE 0 END), 0) AS "COLLFTE",
    #             COALESCE(SUM(CASE WHEN ("SCHG" ~ '^\d+(\.\d+)?$' AND CAST("SCHG"::numeric AS INTEGER) < 15 AND CAST("SCHG"::numeric AS INTEGER) >= 11 AND CAST("WKHP"::numeric AS INTEGER) < 30) THEN 1 ELSE 0 END), 0) AS "COLLPTE",
    #             3 AS "TOPOLOGY",
    #             COALESCE(CAST("JWMNP"::numeric AS INTEGER), 0) AS "TERMINAL"
    #         FROM avl_modeler_projects.project_{project_id}_persons
    #         GROUP BY "BG", "TRACT", "JWMNP";

    #     ''')
    # con.commit()

    cur.execute(f'''
    CREATE TABLE avl_modeler_projects.project_{project_id}_landuse AS
    SELECT 
        ROW_NUMBER() OVER (ORDER BY "BG") AS "TAZ",
        "BG" AS "BG",
        MAX("TRACT") AS "DISTRICT",
        MAX("TRACT") AS "SD",
        MAX("TRACT") AS "COUNTY",
        COALESCE(count(DISTINCT "household_id"), 0) AS "TOTHH",
        COALESCE(count(1), 0) AS "TOTPOP",
        100 AS "TOTACRE",
        70 AS "RESACRE", 
        30 AS "CIACRE",
        COALESCE(SUM(CASE WHEN "ESR" IS NULL THEN 0 ELSE 1 END), 0) AS "TOTEMP",
        COALESCE(SUM(CASE WHEN ("AGEP" ~ '^\d+(\.\d+)?$' AND CAST("AGEP"::numeric AS INTEGER) < 19 AND CAST("AGEP"::numeric AS INTEGER) >= 5) THEN 1 ELSE 0 END), 0) AS "AGE0519",
        COALESCE(SUM(CASE WHEN ("ESR" ~ '^\d+(\.\d+)?$' AND CAST("ESR"::numeric AS INTEGER) = 1) THEN 1 ELSE 0 END), 0) AS "RETEMPN",
        COALESCE(SUM(CASE WHEN ("ESR" ~ '^\d+(\.\d+)?$' AND CAST("ESR"::numeric AS INTEGER) = 2) THEN 1 ELSE 0 END), 0) AS "FPSEMPN",
        COALESCE(SUM(CASE WHEN ("ESR" ~ '^\d+(\.\d+)?$' AND CAST("ESR"::numeric AS INTEGER) = 3) THEN 1 ELSE 0 END), 0) AS "HEREMPN",
        COALESCE(SUM(CASE WHEN ("ESR" ~ '^\d+(\.\d+)?$' AND CAST("ESR"::numeric AS INTEGER) = 6) THEN 1 ELSE 0 END), 0) AS "OTHEMPN",
        COALESCE(SUM(CASE WHEN ("ESR" ~ '^\d+(\.\d+)?$' AND CAST("ESR"::numeric AS INTEGER) = 4) THEN 1 ELSE 0 END), 0) AS "AGREMPN",
        COALESCE(SUM(CASE WHEN ("ESR" ~ '^\d+(\.\d+)?$' AND CAST("ESR"::numeric AS INTEGER) = 5) THEN 1 ELSE 0 END), 0) AS "MWTEMPN",
        5 AS "PRKCST",
        10 AS "OPRKCST",
        0 AS "area_type",
        COALESCE(SUM(CASE WHEN ("SCHG" ~ '^\d+(\.\d+)?$' AND CAST("SCHG"::numeric AS INTEGER) < 15 AND CAST("SCHG"::numeric AS INTEGER) >= 11) THEN 1 ELSE 0 END), 0) AS "HSENROLL",
        COALESCE(SUM(CASE WHEN ("SCHG" ~ '^\d+(\.\d+)?$' AND CAST("SCHG"::numeric AS INTEGER) < 15 AND CAST("SCHG"::numeric AS INTEGER) >= 11 AND CAST("WKHP"::numeric AS INTEGER) >= 30) THEN 1 ELSE 0 END), 0) AS "COLLFTE",
        COALESCE(SUM(CASE WHEN ("SCHG" ~ '^\d+(\.\d+)?$' AND CAST("SCHG"::numeric AS INTEGER) < 15 AND CAST("SCHG"::numeric AS INTEGER) >= 11 AND CAST("WKHP"::numeric AS INTEGER) < 30) THEN 1 ELSE 0 END), 0) AS "COLLPTE",
        3 AS "TOPOLOGY",
        COALESCE(MAX(CAST("JWMNP"::numeric AS INTEGER)), 0) AS "TERMINAL"
    FROM avl_modeler_projects.project_{project_id}_persons
    GROUP BY "BG";
    ''')
    con.commit()

    cur.execute(f'SELECT * FROM avl_modeler_projects.project_{project_id}_landuse')
    landuse_data = cur.fetchall()
    print("landuse_data", landuse_data[:2])

    cur.execute(f'SELECT * FROM avl_modeler_projects.project_{project_id}_persons')
    persons_data = cur.fetchall()
    print("persons_data", persons_data[:2])

    # cur.execute(f'ALTER TABLE avl_modeler_projects.project_{project_id}_households ADD COLUMN "TAZ" INTEGER')
    # cur.execute(f'''
    #     UPDATE avl_modeler_projects.project_{project_id}_households AS h
    #     SET "TAZ" = l."TAZ"
    #     FROM avl_modeler_projects.project_{project_id}_landuse AS l
    #     WHERE h."BG" = l."BG";

    # ''')
    cur.execute(f'ALTER TABLE avl_modeler_projects.project_{project_id}_households ADD COLUMN "TAZ" INTEGER')
    cur.execute(f'''
            UPDATE avl_modeler_projects.project_{project_id}_households
            SET "TAZ" = (
                SELECT l."TAZ"
                FROM avl_modeler_projects.project_{project_id}_landuse AS l
                WHERE l."BG" = avl_modeler_projects.project_{project_id}_households."BG"
                LIMIT 1
            )
        ''')
    

    cur.execute(f'SELECT * FROM avl_modeler_projects.project_{project_id}_households')
    households_data = cur.fetchall()
    print("households_data", len(households_data), households_data[:2])

    con.commit()
    cur.close()
    con.close()

    # Create output directory if it doesn't exist

    # path = os.path.join(folder, 'output', 'activitysim_input')
    # os.makedirs(path, exist_ok=True)


    path = os.getcwd() + '/popsynth_runs/test_prototype_mtc_new/data'

    df_landuse = pd.DataFrame(landuse_data)
    df_landuse.to_csv(os.path.join(path, 'land_use.csv'), index=False)

    df_households = pd.DataFrame(households_data)
    df_households = df_households.loc[df_households["NP"] != "0"]
    df_households.fillna(0, inplace=True)
    df_households["VEH"] = df_households["VEH"].astype(float).add(5).astype(str)
    df_households["WIF"] = df_households["WIF"].astype(float).add(1).astype(str)
    df_households.to_csv(os.path.join(path, 'households.csv'), index=False)

    df_persons = pd.DataFrame(persons_data)
    df_persons["PERID"] = df_persons.index + 1
    df_persons["ptype"] = df_persons["ptype"].fillna(value=4)
    df_persons["AGEP"] = df_persons["AGEP"].astype(float).add(20).astype(str)
    df_persons["pstudent"] = df_persons["pstudent"].fillna(value=3)
    df_persons["pemploy"] = df_persons["pemploy"].fillna(value=3)

    householdIDs = df_households['household_id']
    df_persons = df_persons[df_persons["household_id"].isin(householdIDs)]
    df_persons.fillna(2, inplace=True)
    df_persons.to_csv(os.path.join(path, 'persons.csv'), index=False)

    # Call matrix_omx
    matrix_omx(project_id, selectedBGs, folder)

    return "{\"response\": \"success inserting landuse\"}"

def matrix_omx(project_id, selectedBGs, folder):
    con = get_db_connection_pg()
    cur = con.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    selectedBGsStr = "'" + "','".join(selectedBGs) + "'"
    
    # PostgreSQL does not support spatialite, so we will use PostGIS functions
    # Ensure PostGIS is enabled in your database
    # Enable PostGIS extension in the database if not already enabled
    # cur.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    distancesql = f'''
        SELECT a.geoid AS geoid_1,
               b.geoid AS geoid_2,
               ST_Distance(ST_Centroid(a.geometry), ST_Centroid(b.geometry)) AS distance
        FROM avl_modeler_datasets.tl_2019_36_bg AS a
        CROSS JOIN (
            SELECT geoid, geometry
            FROM avl_modeler_datasets.tl_2019_36_bg
            WHERE geoid IN ({selectedBGsStr})
            ORDER BY geoid
        ) AS b
        WHERE a.geoid IN ({selectedBGsStr})
        ORDER BY a.geoid, b.geoid
    '''

    cur.execute(distancesql)
    distance_output = cur.fetchall()

    geoid_1 = np.unique([d['geoid_1'] for d in distance_output])
    geoid_2 = np.unique([d['geoid_2'] for d in distance_output])

    distancesTable = np.ones((len(geoid_1), len(geoid_2)))
    eaTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
    amTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
    mdTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
    pmTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
    evTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))

    for d in distance_output:
        ea_speed = 55
        am_speed = 25
        pm_speed = 30
        md_speed = 45
        ev_speed = 50
        
        r_num = random.uniform(0.1, 0.3)
       
        ea_travel_time = d['distance'] * 100 / ea_speed
        am_travel_time = d['distance'] * 100 / am_speed
        pm_travel_time = d['distance'] * 100 / pm_speed
        md_travel_time = d['distance'] * 100 / md_speed
        ev_travel_time = d['distance'] * 100 / ev_speed

        i = np.where(geoid_1 == d['geoid_1'])[0][0]
        j = np.where(geoid_2 == d['geoid_2'])[0][0]

        distancesTable[i, j] = d['distance'] * 10

        if d['distance'] == 0:
            distancesTable[i, j] = r_num

        eaTravelTimeTable[i, j] = ea_travel_time * 10000
        amTravelTimeTable[i, j] = am_travel_time * 10000
        mdTravelTimeTable[i, j] = md_travel_time * 10000
        pmTravelTimeTable[i, j] = pm_travel_time * 10000
        evTravelTimeTable[i, j] = ev_travel_time * 10000

    # skims = omx.open_file(folder + '/output/activitysim_input/skims.omx', 'w')
    skims = omx.open_file('popsynth_runs/test_prototype_mtc_new/data/skims.omx', 'w')

    prototype_skims = omx.open_file('popsynth_runs/test_prototype_mtc/data/skims.omx')

    table_names_list = prototype_skims.list_matrices()

    for name in table_names_list:
        if "EA" in name:
            if any(x in name for x in ["SOV", "HOV"]):
                skims[name] = eaTravelTimeTable / 1000
            else:
                skims[name] = eaTravelTimeTable
        elif "AM" in name:
            if any(x in name for x in ["SOV", "HOV"]):
                skims[name] = amTravelTimeTable / 1000
            else:
                skims[name] = amTravelTimeTable
        elif "MD" in name:
            if any(x in name for x in ["SOV", "HOV"]):
                skims[name] = mdTravelTimeTable / 1000
            else:
                skims[name] = mdTravelTimeTable
        elif "PM" in name:
            if any(x in name for x in ["SOV", "HOV"]):
                skims[name] = pmTravelTimeTable / 1000
            else:
                skims[name] = pmTravelTimeTable
        elif "EV" in name:
            if any(x in name for x in ["SOV", "HOV"]):
                skims[name] = evTravelTimeTable / 1000
            else:
                skims[name] = evTravelTimeTable
        elif "DISTBIKE" in name:
            skims[name] = distancesTable * 0.9
        elif "DISTWALK" in name:
            skims[name] = distancesTable * 1.2
        else:
            skims[name] = distancesTable * 0.7

    prototype_skims.close()
    skims.close()

    con.close()