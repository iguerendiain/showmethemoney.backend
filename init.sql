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

create sequence currency_id_seq start 1 increment 1 NO MAXVALUE cache 1;

create table currency (
	id int not null primary key default nextval('currency_id_seq'),

	name varchar(256) not null,
	factor real not null default 1,

	deleted boolean not null default false,
	owner int not null references person(id) on delete restrict,
	updated int not null default extract(epoch from CURRENT_TIMESTAMP)
);

create sequence account_id_seq start 1 increment 1 NO MAXVALUE cache 1;

create table account (
	id int not null primary key default nextval('account_id_seq'),

	name varchar(256) not null,
	currency int not null references currency(id) on delete restrict,

	deleted boolean not null default false,
	owner int not null references person(id) on delete restrict,
	updated int not null default extract(epoch from CURRENT_TIMESTAMP)
);

create sequence record_id_seq start 1 increment 1 NO MAXVALUE cache 1;

create type recordtype as enum ('patch','income','expense');

create table record (
	id int not null primary key default nextval('record_id_seq'),

	description varchar(256) not null,
	account int not null references account(id) on delete restrict,
	currency int not null references currency(id) on delete restrict,
	type recordtype not null,
	time int not null,

	deleted boolean not null default false,
	owner int not null references person(id) on delete restrict,
	updated int not null default extract(epoch from CURRENT_TIMESTAMP)
);
