# PROTOTYPE (#28): infra/postgres imajının arama kısmı. Ek dosya yok; yalnızca şema.
FROM postgres:17
ENV LANG=en_US.utf8
COPY search.sql /docker-entrypoint-initdb.d/10-search.sql
