import pandas as pd
import sqlite3
import psycopg2
import psycopg2.extras as extras

try:
    # Connect to SQLite database
    sqlite_conn = sqlite3.connect('database/activitysimserver_old.sqlite')

    # Load the table from SQLite into a pandas DataFrame
    df = pd.read_sql_query('SELECT * FROM psam_p36', sqlite_conn)

    # Close SQLite connection
    sqlite_conn.close()

    # Convert column names to uppercase
    df.columns = [col.upper() for col in df.columns]

    # Connect to PostgreSQL database
    pg_conn = psycopg2.connect(
        database="kari", 
        user="dama_dev_user", 
        password="57e5b991-630f-4ca8-8078-f552744a2cf1", 
        host="mercury.availabs.org", 
        port="5532"
    )

    pg_cursor = pg_conn.cursor()

    # Ensure the schema exists
    pg_cursor.execute("CREATE SCHEMA IF NOT EXISTS avl_modeler_datasets")
    pg_conn.commit()

    # Check if the 'psam_h36' table exists in the schema
    pg_cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'avl_modeler_datasets' 
            AND table_name = 'psam_p36'
        );
    """)
    table_exists = pg_cursor.fetchone()[0]

    if not table_exists:
        # Create the 'psam_h36' table based on DataFrame columns
        columns = ", ".join([f'"{col}" TEXT' for col in df.columns])
        create_table_query = f'CREATE TABLE avl_modeler_datasets.psam_p36 ({columns})'

        pg_cursor.execute(create_table_query)
        pg_conn.commit()

    # Use psycopg2's execute_values for efficient bulk inserts
    tuples = [tuple(row) for row in df.itertuples(index=False, name=None)]
    columns_str = ", ".join([f'"{col}"' for col in df.columns])
    insert_query = f'INSERT INTO avl_modeler_datasets.psam_p36 ({columns_str}) VALUES %s'

    extras.execute_values(pg_cursor, insert_query, tuples)
    pg_conn.commit()

except Exception as e:
    print(f"An error occurred: {e}")

finally:
    # Close PostgreSQL connection
    if 'pg_cursor' in locals():
        pg_cursor.close()
    if 'pg_conn' in locals():
        pg_conn.close()
