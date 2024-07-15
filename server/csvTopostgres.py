import pandas as pd
import psycopg2
import psycopg2.extras as extras

def create_psam_p36_table():
    try:
        # Load the CSV file into a pandas DataFrame
        df = pd.read_csv('database/psam_p36.csv')

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

        # Check if the 'psam_p36' table exists in the schema
        pg_cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'avl_modeler_datasets' 
                AND table_name = 'psam_p36'
            );
        """)
        table_exists = pg_cursor.fetchone()[0]

        if not table_exists:
            # Create the 'psam_p36' table based on DataFrame columns
            columns = ", ".join(f"{col} TEXT" for col in df.columns) 
            create_table_query = f"CREATE TABLE avl_modeler_datasets.psam_p36 ({columns})"

            pg_cursor.execute(create_table_query)
            pg_conn.commit()

        # Function to insert data in batches
        def execute_batch_insert(conn, df, table, page_size=10000):
            tuples = [tuple(x) for x in df.to_numpy()]
            cols = ','.join(list(df.columns))
            query = f"INSERT INTO {table}({cols}) VALUES %s"
            cursor = conn.cursor()
            try:
                extras.execute_values(cursor, query, tuples, page_size=page_size)
                conn.commit()
            except Exception as e:
                conn.rollback()
                print(f"Error: {e}")
                cursor.close()
                return 1
            print("execute_values() done")
            cursor.close()

        # Insert DataFrame into PostgreSQL table in batches
        execute_batch_insert(pg_conn, df, 'avl_modeler_datasets.psam_p36')

    except Exception as e:
        print(f"An error occurred: {e}")

    finally:
        # Close PostgreSQL connection
        if 'pg_cursor' in locals():
            pg_cursor.close()
        if 'pg_conn' in locals():
            pg_conn.close()

# Run the function
create_psam_p36_table()
