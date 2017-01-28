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
	uuid char(36) not null,
	name varchar(256),
	factor real not null default 1,
	code varchar(3) not null primary key,
	symbol varchar(4)
);

create unique index currency_uuid on currency (uuid);

create table account (
	uuid char(36) not null primary key,

	name varchar(256) not null,
	currency varchar(3) not null references currency(code) on delete restrict,
	balance int not null default 0,

	deleted boolean not null default false,
	owner int not null references person(id) on delete restrict,
	updated int not null default extract(epoch from CURRENT_TIMESTAMP)
);

create type recordtype as enum ('patch','income','expense');

create table record (
	uuid char(36) not null primary key,

	description varchar(256) not null,
	account char(36) not null references account(uuid) on delete restrict,
	currency varchar(3) not null references currency(code) on delete restrict,
	type recordtype not null,
	time int not null,
	amount int not null,
	loclat real,
	loclng real, 

	deleted boolean not null default false,
	owner int not null references person(id) on delete restrict,
	updated int not null default extract(epoch from CURRENT_TIMESTAMP)
);

create sequence tag_id_seq start 1 increment 1 NO MAXVALUE cache 1;

create table tag (
	id int not null primary key default nextval('tag_id_seq'),
	tag varchar(64) not null
);

create unique index tag_tag on tag (tag);

create table tag_record (
	tagid int not null,
	recorduuid char(36) not null
);

create unique index tag_records on tag_record (tagid, recorduuid);
