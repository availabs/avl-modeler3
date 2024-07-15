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

# conpostgres = psycopg2.connect(host='mars.availabs.org', database='height',
#     user='postgres', password='Jedi21funk')
# curpostgres = conpostgres.cursor()



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
        command = "activitysim run -c configs -d data -o output"
        subprocess.run(command, shell=True, capture_output=True, text=True)
        # result = subprocess.run(command, shell=True, capture_output=True, text=True )


        job = queue.enqueue('tasks.popsynth.load_senario_run',
                            folder_path, project_id, senario_id, job_timeout=3600)

       

        print('Task completed')
        return "activitySim run successful"
        
    except:


        con = get_db_connection()
        cur = con.cursor()
        status = "failed"
        # cur = con.cursor()
        cur.execute('''UPDATE senarios SET status = ? WHERE id = ?''',
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
    

    # strip whitespace from headers
    # df_trips.columns = df_trips.columns.str.strip()
    # df_persons.columns = df_persons.columns.str.strip()
    # df_households.columns = df_households.columns.str.strip()
    # df_landuse.columns = df_landuse.columns.str.strip()

    # drop data into database
    # df.to_sql("project_datadict", con)

    con = get_db_connection()
    cur = con.cursor()

    df_trips.to_sql("senario_"+senario_id+"_trips", con)
    df_persons.to_sql("senario_"+senario_id+"_persons", con)
    df_households.to_sql("senario_"+senario_id+"_households", con)
    df_landuse.to_sql("senario_"+senario_id+"_landuse", con)

# Try chuck 

# one thing at a time


    # con = get_db_connection()
    # cur = con.cursor()

    # df_trips_chunks = pd.read_csv(folder + 'output/final_trips.csv', sep=',',
    #                          error_bad_lines=False, index_col=False, dtype='unicode', chunksize=1000)
    
    # # df_trips_chunks.columns = df_trips_chunks.columns.str.strip()

    # for chunk in df_trips_chunks:
    #     chunk.to_sql(name="senario_"+senario_id+"_trips", if_exists='append', con=con)


    # df_persons_chunks = pd.read_csv(folder + 'output/final_persons.csv', sep=',',
    #                          error_bad_lines=False, index_col=False, dtype='unicode', chunksize=1000)
    # # df_persons_chunks.columns = df_persons_chunks.columns.str.strip()
    # for chunk in df_persons_chunks:
    #     chunk.to_sql(name="senario_"+senario_id+"_persons", if_exists='append', con=con)


    # df_households_chunks = pd.read_csv(folder + 'output/final_households.csv', sep=',',
    #                             error_bad_lines=False, index_col=False, dtype='unicode', chunksize=100)
    # # df_households_chunks.columns = df_households_chunks.columns.str.strip()
    # for chunk in df_households_chunks:
    #     chunk.to_sql(name="senario_"+senario_id+"_households", if_exists='append', con=con)



    # df_landuse_chunks = pd.read_csv(folder + 'output/final_land_use.csv', sep=',',
    #                               error_bad_lines=False, index_col=False, dtype='unicode', chunksize=100)
    # # df_landuse_chunks.columns = df_landuse_chunks.columns.str.strip()
    # for chunk in df_landuse_chunks:
    #     chunk.to_sql(name="senario_"+senario_id+"_landuse", if_exists='append', con=con)
    

 



# using odo
    # odo('myfile.*.csv', 'postgresql://hostname::tablename')


    # update status in senario table
    status = "complete"
    # cur = con.cursor()
    cur.execute('''UPDATE senarios SET status = ? WHERE id = ? AND project_id = ? ''',
                (status, senario_id, project_id))

    print("project Table's status: ")
    data = cur.execute(
        '''SELECT status FROM senarios WHERE id = ? AND project_id = ?''', (senario_id, project_id,))
    for row in data:
        print("senario status of", project_id, "_", senario_id, "is", row)

    # conn.execute("CREATE TABLE students"+project_id+'datadict"(name TEXT, addr TEXT, city TEXT, pin TEXT)')

    con.commit()
    con.close()


    return "activitySim outputs succeefully inserted to database"


def run_popsynth(args, project_id, selectedBGs):
    print('Starting task')
    print('task args test', args)
    try:
        run(args)
        job = queue.enqueue('tasks.popsynth.load_popsynth_run',
                            args.working_dir, project_id, selectedBGs, job_timeout=3600)
        
        print('Task completed')
    except:
        # this code currently never runs because run function doesn't raise exception on failure
        # insert failed project status into database

        con = get_db_connection()
        cur = con.cursor()
        status = "failed"
        # cur = con.cursor()
        cur.execute('''UPDATE projects SET status = ? WHERE id = ?''',
                    (status, project_id))

        con.commit()
        con.close()

        return "failed status inserted"
        print('PopSynth run failed')




def load_popsynth_run(folder, project_id, selectedBGs):
    # def load_popsynth_run(folder, project_id, args):
    print('load popsynth from folder', folder)

    # update the projects status to loading
    # create table in sqlite project_%id_datadict
    # create table in sqlite project_%id_persons
    # create table in sqlite project_%id_households
    # open those files and write them into the corresponding tables
    # update the status of the project to 'complete'

    # load data
    print("path", folder + '/output')

    df_datadic = pd.read_csv(folder + '/output/data_dict.csv', sep=',',
                             error_bad_lines=False, index_col=False, dtype='unicode')

    df_persons = pd.read_csv(folder + '/output/synthetic_persons.csv', sep=',',
                             error_bad_lines=False, index_col=False, dtype='unicode')

    df_households = pd.read_csv(folder + '/output/synthetic_households.csv', sep=',',
                                error_bad_lines=False, index_col=False, dtype='unicode')

    df_geocrosswalk = pd.read_csv(folder + '/data/geo_cross_walk.csv', sep=',',
                                  error_bad_lines=False, index_col=False, dtype='unicode')

    # strip whitespace from headers
    df_datadic.columns = df_datadic.columns.str.strip()
    df_persons.columns = df_persons.columns.str.strip()
    df_households.columns = df_households.columns.str.strip()
    df_geocrosswalk.columns = df_geocrosswalk.columns.str.strip()

    # drop data into database
    # df.to_sql("project_datadict", con)

    con = get_db_connection()
    cur = con.cursor()

    df_datadic.to_sql("project_"+project_id+"_datadict", con)
    df_persons.to_sql("project_"+project_id+"_persons", con)
    df_households.to_sql("project_"+project_id+"_households", con)
    df_geocrosswalk.to_sql("project_"+project_id+"_geocrosswalk", con)

    # update status in project table
    status = "complete"
    # cur = con.cursor()
    cur.execute('''UPDATE projects SET status = ? WHERE id = ?''',
                (status, project_id))

    print("project Table's status: ")
    data = cur.execute(
        '''SELECT status FROM projects where id = ?''', (project_id,))
    for row in data:
        print("project status of", project_id, "is", row)

    # conn.execute("CREATE TABLE students"+project_id+'datadict"(name TEXT, addr TEXT, city TEXT, pin TEXT)')

    con.commit()
    con.close()

    # delete local folder

    # shutil.rmtree(folder)

    #call create_landuse
    create_landuse_table(project_id, selectedBGs, folder)

    return "{\"reponse\": \"success inserting datadict,person,households,geocrosswalk\"}"


#  create landuse table in sqldb


def create_landuse_table(project_id, selectedBGs,folder):
    con = get_db_connection()
    cur = con.cursor()

    cur.execute('''CREATE TABLE project_'''+project_id+'''_landuse AS
                    select 
                    ROW_NUMBER() OVER (ORDER BY bg) AS TAZ,
                    bg as BG,
                    tract as DISTRICT,
                    tract as SD,
                    tract as COUNTY,
                    COALESCE(count( distinct household_id), 0)  as TOTHH,
                    COALESCE(count(1), 0)  as TOTPOP,
                    100 as TOTACRE, -- will need to join on spatial data
                    70 as RESACRE, 
                    30 as CIACRE,
                    COALESCE(sum(CASE  when ESR is null then 0 else 1 end), 0)  as TOTEMP,
                    COALESCE(sum(CASE  when ( CAST(AGEP AS INTEGER) < 19 and CAST(AGEP AS INTEGER) >= 5 ) then 1 else 0 end), 0)  as AGE0519,
                    COALESCE(sum(CASE  when CAST(ESR AS INTEGER) = 1.0  then 1 else 0 end), 0)  as RETEMPN,
                    COALESCE(sum(CASE  when CAST(ESR AS INTEGER) = 2.0  then 1 else 0 end), 0)  as FPSEMPN,
                    COALESCE(sum(CASE  when CAST(ESR AS INTEGER) = 3.0 then 1 else 0 end), 0)  as HEREMPN,
                    COALESCE(sum(CASE  when CAST(ESR AS INTEGER) = 6.0  then 1 else 0 end), 0)  as OTHEMPN,
                    COALESCE(sum(CASE  when CAST(ESR AS INTEGER) = 4.0  then 1 else 0 end), 0)  as AGREMPN,
                    COALESCE(sum(CASE  when CAST(ESR AS INTEGER) = 5.0  then 1 else 0 end), 0)  as MWTEMPN,
                    5 as PRKCST,
                    10 as OPRKCST,
                    0 as area_type,
                    COALESCE(sum(CASE  when (CAST(SCHG AS INTEGER) < 15 and CAST(SCHG AS INTEGER) >= 11) then 1 else 0 end), 0)  as HSENROLL,
                    COALESCE(sum(CASE  when ( CAST(SCHG AS INTEGER) < 15 and CAST(SCHG AS INTEGER) >= 11 and CAST(WKHP AS INTEGER) >=30) then 1 else 0 end), 0)  as COLLFTE,
                    COALESCE(sum(CASE  when ( CAST(SCHG AS INTEGER) < 15 and CAST(SCHG AS INTEGER) >= 11 and CAST(WKHP AS INTEGER) < 30) then 1 else 0 end), 0)  as COLLPTE,
                    3 as  TOPOLOGY,
                    COALESCE(JWMNP, 0)  as TERMINAL

                    from project_'''+project_id+'''_persons
                    group by bg

                    ''')
    con.commit()


    # Execute a SELECT statement to retrieve the data from the table
    # landuse_data = cur.execute('''SELECT * FROM project_'''+project_id+'''_landuse''').fetchall()

    # con.commit()

    cur.execute('''SELECT * FROM project_'''+project_id+'''_landuse''')
    # headers = [description[0] for description in cur.description]
    landuse_data = cur.fetchall()
    print("landuse_data", landuse_data[:2])

    # # Retrieve the column names
    # headers = [description[0] for description in cur.description]

    # # Open a CSV file for writing
    # with open('popsynth_runs/landuse.csv', 'w', newline='') as landuse:
    #     # Create a CSV writer object
    #     writer = csv.writer(landuse)

    #     # Write the column headers to the CSV file
    #     writer.writerow(headers)
    #     # count = 0

    #     # Write the data rows to the CSV file
    #     for row in landuse_data:
    #         # if count == 0:
    #         #     # header = landuse_data.keys()
    #         #     writer.writerow(headers)
    #         #     count += 1

    #         writer.writerow(row.values())

    # Commit changes to the database
    cur.execute('''SELECT * FROM project_'''+project_id+'''_persons''')
    # headers = [description[0] for description in cur.description]
    persons_data = cur.fetchall()
    print("persons_data", persons_data[:2])



    #     -- Add a new column to the table
    # ALTER TABLE project_1_households ADD COLUMN TAZ2 INTEGER;

    # -- Update the TAZ values based on BG
    # UPDATE project_1_households SET TAZ2 = (
    # SELECT COUNT(*) FROM (
    #     SELECT DISTINCT BG FROM project_1_households
    # ) AS t
    # WHERE t.BG <= project_1_households.BG
    # );




    cur.execute('''ALTER TABLE project_'''+project_id+'''_households ADD COLUMN TAZ INTEGER''')
    cur.execute('''UPDATE project_'''+project_id+'''_households SET TAZ = (
     SELECT TAZ  FROM project_'''+project_id+'''_landuse
     WHERE project_'''+project_id+'''_landuse.BG = project_'''+project_id+'''_households.BG
     )''')

    cur.execute('''SELECT * FROM project_'''+project_id+'''_households''')
    # cur.execute('''SELECT * FROM project_'''+project_id+'''_households where NP !=0 ''')
  
    # headers = [description[0] for description in cur.description]
    households_data = cur.fetchall()
    print("households_data", len(households_data), households_data[:2])    

    con.commit()
    con.close()


    # using Pondas creating csv file --much simpler 
    # activitySimInputPath = '/home/jin/AVAIL/code/activitysim/activitysim/activitysim_new/activitysim/activitysim/examples/test_prototype_mtc_new/data/'
    activitySimInputPath = '/home/jin/AVAIL/code/avl-modeler2/server/popsynth_runs/test_prototype_mtc_new/data/'
    # activitySimInputPath = '/home/jin/AVAIL/code/avl-modeler2/server/popsynth_runs/activitysim/activitysim/examples/test_prototype_mtc_new/data/'


    path = folder + '/output/' 
    os.makedirs(os.path.join(path, 'activitysim_input/'))
    # os.makedirs(os.path.join(activitySimInputPath, 'activitysim_input/'))


    df = pd.DataFrame(landuse_data)
    df.to_csv(path + 'activitysim_input/land_use.csv', index=False)
    df.to_csv(activitySimInputPath + 'land_use.csv', index=False)


    dfh = pd.DataFrame(households_data)
    dfh = dfh.loc[dfh["NP"] != "0"]
    dfh.fillna(0, inplace=True)
    dfh.to_csv(path + 'activitysim_input/households.csv', index=False)
    dfh.to_csv(activitySimInputPath + 'households.csv', index=False)


    dfp = pd.DataFrame(persons_data)
    dfp["PERID"] = dfp["index"]+1

    dfp["ptype"] = dfp["ptype"].fillna(value=4)
    dfp["pstudent"] = dfp["pstudent"].fillna(value=3)
    dfp["pemploy"] = dfp["pemploy"].fillna(value=3)

   #filter out dfh[household_id] when dfh["NP"]===0
    # householdIDs = dfh.loc[dfh['NP'] == 0, 'household_id']
    householdIDs = dfh['household_id']
 

    print("householdIDs", householdIDs)

    dfp = dfp[dfp["household_id"].isin(householdIDs)]
    
    # dfp['JWMNP'] = np.random.randint(1, 200, dfp.shape[0])
    # dfp['SCHGR'] = np.random.randint(1, 3, dfp.shape[0])
    # dfp['WKHPR'] = np.random.randint(1, 4, dfp.shape[0])
    # dfp.fillna(0, inplace=True)
    dfp.fillna(2, inplace=True)

    dfp.to_csv(path + 'activitysim_input/persons.csv', index=False)
    dfp.to_csv(activitySimInputPath + 'persons.csv', index=False)
    



     
    #call_create_distance_table(project_id, selectedBGs)
    matrix_omx(project_id,selectedBGs,folder)

    return "{\"reponse\": \"success inserting landuse\"}"



# def create_distance_table(project_id, selectedBGs):

#     con = get_db_connection()
#     cur = con.cursor()
# #  create distance matrix table in sqldb

#     # selectedBGsStr = ''.join(selectedBGs)
#     selectedBGsStr ="'" + "','".join(selectedBGs) + "'"
#     print("selectedBGs",selectedBGs, len(selectedBGs))
#     print("selectedBGsStr", selectedBGsStr,  len(selectedBGsStr))

# #   important to enable other wise permission error of load_extention
#     con.enable_load_extension(True)

#     cur.execute(''' SELECT load_extension('/usr/local/lib/mod_spatialite')''')
#     # cur.execute(''' SELECT load_extension('/home/jin/miniconda3/envs/ASIM_DEV/lib/mod_spatialite')''')
#     # cur.execute(''' SELECT load_extension('mod_spatialite')''')
    
#     cur.execute(''' CREATE TABLE project_'''+project_id+'''_distance (
#                         --ogc_fid	INTEGER PRIMARY KEY AUTOINCREMENT,
#                             geoid_1 TEXT NOT NULL,
#                             geoid_2 TEXT NOT NULL,
#                             distance FLOAT NOT NULL
#                         )
#                     ''')

#     cur.execute(''' INSERT INTO project_'''+project_id+'''_distance(geoid_1, geoid_2, distance)
#                     SELECT a.geoid as geoid_1,
#                         b.geoid as geoid_2,
#                         ST_Distance(ST_Centroid(GeomFromWKB(a.geometry)), ST_Centroid(GeomFromWKB(b.geometry))) AS distance
#                     FROM tl_2019_36_bg AS a
#                     CROSS JOIN (
#                         SELECT geoid, geometry
#                         FROM tl_2019_36_bg
                   
#                         WHERE  geoid in ('''+selectedBGsStr+''')

#                         ORDER BY geoid

#                     ) AS b
#                     WHERE a.geoid in ('''+selectedBGsStr+''')
#                     ORDER BY a.geoid, b.geoid
                    
#                     ''')


#     con.commit()
#     con.close()

#     # delete local folder
#     # shutil.rmtree(folder)


#     print('PopSynth run successfully',
#           " and local task folder", project_id, "deleted")
  
#     #call matrix_omx()
#     matrix_omx(selectedBGs)


def matrix_omx(project_id,selectedBGs,folder):
    
    con = get_db_connection()
    cur = con.cursor()

    # selectedBGsStr = ''.join(selectedBGs)
    selectedBGsStr ="'" + "','".join(selectedBGs) + "'"
    # print("selectedBGs",selectedBGs, len(selectedBGs))
    # print("selectedBGsStr", selectedBGsStr,  len(selectedBGsStr))

# load specialite
    con.enable_load_extension(True)

    # cur.execute(''' SELECT load_extension('/usr/local/lib/mod_spatialite')''')
    cur.execute(''' SELECT load_extension('/home/jin/miniforge3/envs/ASIM_DEV_new/lib/mod_spatialite')''')

    distancesql = f'''SELECT a.geoid as geoid_1,
                        b.geoid as geoid_2,
                        ST_Distance(ST_Centroid(GeomFromWKB(a.geometry)), ST_Centroid(GeomFromWKB(b.geometry))) AS distance
                    FROM tl_2019_36_bg AS a
                    CROSS JOIN (
                        SELECT geoid, geometry
                        FROM tl_2019_36_bg
                   
                        WHERE  geoid in ('''+selectedBGsStr+''')

                        ORDER BY geoid

                    ) AS b
                    WHERE a.geoid in ('''+selectedBGsStr+''')
                    ORDER BY a.geoid, b.geoid
                    '''
    distance_output = con.execute(distancesql).fetchall()

    # print("distance_output----------", distance_output[:10], ones[:10] )

# trying some matrix test

# input array
    # distance_output = [{'geoid_1': '360359701001', 'geoid_2': '360359701001', 'distance': 0.0},
    #     {'geoid_1': '360359701001', 'geoid_2': '360359701002', 'distance': 0.06108229323259779}]

    # Extract unique geoid_1 and geoid_2
    geoid_1 = np.unique([d['geoid_1'] for d in distance_output])
    geoid_2 = np.unique([d['geoid_2'] for d in distance_output])

    # Create new matrix table based on length
    distancesTable = np.ones((len(geoid_1), len(geoid_2)))

    # by timeperiod how to change distance?? not speed...
    eaTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
    amTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
    mdTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
    pmTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
    evTravelTimeTable = np.ones((len(geoid_1), len(geoid_2)))
  

    # Fill in new data- distances/travel times from input array
    for d in distance_output:

        ea_speed = 55
        am_speed = 25
        pm_speed = 30
        md_speed = 45
        ev_speed = 50
        
        r_num = random.uniform(0.1, 0.3)
       

        ea_travel_time = d['distance']*100/ea_speed
        am_travel_time = d['distance']*100/am_speed
        pm_travel_time = d['distance']*100/pm_speed
        md_travel_time = d['distance']*100/md_speed
        ev_travel_time = d['distance']*100/ev_speed

        i = np.where(geoid_1 == d['geoid_1'])[0][0]
        j = np.where(geoid_2 == d['geoid_2'])[0][0]
        # distancesTable[i, j] = d['distance']*1000000
        # distancesTable[i, j] = d['distance']

  # modify distanceTable[i,j] if distance =0 then assign .1 or .2
#   if d['distance'] = 0 then random .2 or .1
        distancesTable[i, j] = d['distance']*10

        if d['distance'] == 0:

            distancesTable[i, j] = r_num
      

      

        #byTravelTime
        eaTravelTimeTable[i, j] = ea_travel_time*10000
        amTravelTimeTable[i, j] = am_travel_time*10000
        mdTravelTimeTable[i, j] = md_travel_time*10000
        pmTravelTimeTable[i, j] = pm_travel_time*10000
        evTravelTimeTable[i, j] = ev_travel_time*10000
      

    # Print array
    # print("distancesTable-------", distancesTable)

    # Create an OMX file (will overwrite existing file!)
    # activitySimInputPath = '/home/jin/AVAIL/code/activitysim/activitysim/activitysim_new/activitysim/activitysim/examples/test_prototype_mtc_new/data/'    
  
    activitySimInputPath = '/home/jin/AVAIL/code/avl-modeler2/server/popsynth_runs/test_prototype_mtc_new/data/'
    # activitySimInputPath = '/home/jin/AVAIL/code/avl-modeler2/server/popsynth_runs/activitysim/activitysim/examples/test_prototype_mtc_new/data/'
    
    # skims = omx.open_file(folder +'/output/activitysim_input/skims.omx','w')   # use 'a' to append/edit an existing file
    skims = omx.open_file(activitySimInputPath +'skims.omx','w')
    # Write to the file.

    # skims['distance4'] = distancesTable
    # skims['eatraveltime'] = eaTravelTimeTable
    # skims['amtraveltime'] = amTravelTimeTable    
    # distance_data = skims['distance4'][:]

    # print("skims['distance4']", skims['distance4'], distance_data)
    # print ('Table names:----------', skims.list_matrices())   # ['distance','distance2',',distance3']


    # Create a pandas DataFrame with the new column and row names ( turns out no need)
    # df = pd.DataFrame(distance_data, columns=geoid_1, index=geoid_1)
    # print("DataFrame", df, df.dtypes)
    # skims['distance5'] = df 

    # Creating other 700 tables with names from prototype_mtc skims's names
    prototype_skims = omx.open_file('popsynth_runs/test_prototype_mtc/data/skims.omx')

    # print ('Table names_prototype_mtc:', prototype_skims.list_matrices())   
    # # ['DIST', 'DISTBIKE', 'DISTWALK', 'DRV_COM_WLK_BOARDS__AM'...]

    table_names_list =  prototype_skims.list_matrices()
    
    for i, name in enumerate(table_names_list):
    # make new table names and write to the each table

    # travelTime by time period 
     if "EA" in name:
    #     #  skims[name].attrs.timeperiod = 'ea'
        if any([x in name for x in ["SOV", "HOV" ]]):
        # if "SOV" or "HOV" in name:
         skims[name]= eaTravelTimeTable/1000
        else:
         skims[name]= eaTravelTimeTable

     elif "AM" in name:
        #  skims[name].attrs.timeperiod = 'am'
        if any([x in name for x in ["SOV", "HOV" ]]):
         skims[name]= amTravelTimeTable/1000
        else:
         skims[name]= amTravelTimeTable

     elif "MD" in name:
        if any([x in name for x in ["SOV", "HOV" ]]):
         skims[name]= mdTravelTimeTable/1000
        else:
        #  skims[name].attrs.timeperiod = 'md'
         skims[name]= mdTravelTimeTable

     elif "PM" in name:
        if any([x in name for x in ["SOV", "HOV" ]]):
         skims[name]= pmTravelTimeTable/1000
        else:
        #  skims[name].attrs.timeperiod = 'pm'
         skims[name]= pmTravelTimeTable

     elif "EV" in name:
        if any([x in name for x in ["SOV", "HOV" ]]):
         skims[name]= evTravelTimeTable/1000
        else:
        #  skims[name].attrs.timeperiod = 'ev'
         skims[name]= evTravelTimeTable

     elif "DISTBIKE" in name:
          skims[name]= distancesTable*0.9 
     elif "DISTWALK" in name:
          skims[name]= distancesTable*1.2 

   #distance
     else:
        skims[name]= distancesTable*0.7
     

    prototype_skims.close()

    skims.close()

