create sequence person_id_seq start 1 increment 1 NO MAXVALUE cache 1;

create table person (
	id int not null primary key default nextval('person_id_seq'),
	email varchar(256) not null unique,
	name varchar(256) not null,
	firstname varchar(256),
	lastname varchar(256),
	avatar varchar(256),
	admin boolean not null default false,
	google varchar(32) unique
);

create sequence client_id_seq start 1 increment 1 NO MAXVALUE cache 1;

create type clienttype as enum ('android', 'web');

create table client (
	id int not null primary key default nextval('client_id_seq'),
	clientid varchar(256) not null,
	type clienttype not null,
	owner int not null references person(id) on delete restrict 
);

create sequence session_id_seq start 1 increment 1 NO MAXVALUE cache 1;

create table session (
	id int not null primary key default nextval('session_id_seq'),
	token varchar(256) not null unique,
	client int not null references client(id) on delete restrict,
	owner int not null references person(id) on delete restrict,
	lastaccess int not null default extract(epoch from CURRENT_TIMESTAMP)
);

create table currency (
	uuid char(36) not null primary key,

	name varchar(256) not null,
	factor real not null default 1,
	code char(3) not null,
	symbol char(3) not null,

	deleted boolean not null default false,
	owner int not null references person(id) on delete restrict,
	updated int not null default extract(epoch from CURRENT_TIMESTAMP)
);

create table account (
	uuid char(36) not null primary key,

	name varchar(256) not null,
	currency char(36) not null references currency(uuid) on delete restrict,

	deleted boolean not null default false,
	owner int not null references person(id) on delete restrict,
	updated int not null default extract(epoch from CURRENT_TIMESTAMP)
);

create type recordtype as enum ('patch','income','expense');

create table record (
	uuid char(36) not null primary key,

	description varchar(256) not null,
	account char(36) not null references account(uuid) on delete restrict,
	currency char(36) not null references currency(uuid) on delete restrict,
	type recordtype not null,
	time int not null,

	deleted boolean not null default false,
	owner int not null references person(id) on delete restrict,
	updated int not null default extract(epoch from CURRENT_TIMESTAMP)
);
