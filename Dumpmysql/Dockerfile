FROM mysql:8.0

# Set environment variables for MySQL
ENV MYSQL_AUTHENTICATION_PLUGIN=mysql_native_password
ENV MYSQL_ROOT_PASSWORD='P@ssw0rd'
ENV MYSQL_DATABASE='db_ecommerce'
ENV MYSQL_USER='parn'
ENV MYSQL_PASSWORD='P@ssw0rd'
# Expose the default MySQL port
EXPOSE 3306

# Create a directory for the database initialization scripts
RUN mkdir -p /docker-entrypoint-initdb.d

# Copy the database backup file to the initialization directory
COPY backup.sql /docker-entrypoint-initdb.d/

# Command to run MySQL server
CMD ["mysqld"]
