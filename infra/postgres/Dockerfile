# Homelibra's own PostgreSQL image (ADR-0006, ADR-0007). Search dictionaries
# and rule files for ADR-0010 will be copied in here.
FROM postgres:17

# unaccent and pg_trgm ship in the image's contrib; they are trusted
# extensions, so the owner role creates them from a migration. Fail the
# build if either is ever missing.
RUN test -f "$(pg_config --sharedir)/extension/unaccent.control" \
 && test -f "$(pg_config --sharedir)/extension/pg_trgm.control"

ENV LANG=en_US.utf8

COPY initdb/ /docker-entrypoint-initdb.d/
