# Homelibra's own PostgreSQL image (ADR-0006, ADR-0007). Search needs no
# files of its own here: its SQL functions (ADR-0010) arrive with the
# migrations, on top of unaccent, pg_trgm, the built-in turkish_stem and the
# en_US.UTF-8 locale below, which their lowercasing and word splitting rely on.
FROM postgres:17

# unaccent and pg_trgm ship in the image's contrib; they are trusted
# extensions, so the owner role creates them from a migration. Fail the
# build if either is ever missing.
RUN test -f "$(pg_config --sharedir)/extension/unaccent.control" \
 && test -f "$(pg_config --sharedir)/extension/pg_trgm.control"

ENV LANG=en_US.utf8

COPY initdb/ /docker-entrypoint-initdb.d/
