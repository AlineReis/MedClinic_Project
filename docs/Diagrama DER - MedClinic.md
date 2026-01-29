```

1

```

```

1

```

```

0..

```

```

\*

1

```

```

\*

```

```

1

```

```

\*

```

```

0..

```

```

\*

```

```

\* 0..

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

users

id integer

name varchar

email varchar

password varchar

role user\_role

cpf varchar

phone varchar

created\_at timestamp

updated\_at timestamp

```

```

professional\_details

id integer

user\_id integer

specialty specialty\_type

registration\_number varchar

council varchar

consultation\_price decimal(10,2)

commission\_percentage decimal(5,2)

```

```

availabilities

id integer

professional\_id integer

day\_of\_week integer

start\_time time

end\_time time

is\_active boolean appointments

id integer

patient\_id integer

professional\_id integer

date date

time time

duration\_minutes integer

type appointment\_type

status appointment\_status

price decimal(10,2)

payment\_status payment\_status

video\_link varchar

room\_number varchar

cancellation\_reason varchar

cancelled\_by integer

created\_at timestamp

updated\_at timestamp

```

exam\_catalog



id integer



name varchar



type exam\_type



base\_price decimal(10,2)



description varchar



```

exam\_requests

id integer

appointment\_id integer

patient\_id integer

requesting\_professional\_id integer

exam\_catalog\_id integer

clinical\_indication text

status exam\_status

price decimal(10,2)

payment\_status payment\_status

scheduled\_date datetime

result\_file\_url varchar

result\_text text

lab\_tech\_id integer

created\_at timestamp

```

```

prescriptions

id integer

appointment\_id integer

patient\_id integer

professional\_id integer

medication\_name varchar

dosage varchar

instructions text

is\_controlled boolean

pdf\_url varchar

created\_at timestamp

```

```

transactions

id integer

type transaction\_type

reference\_id integer

payer\_id integer

amount\_gross decimal(10,2)

mdr\_fee decimal(10,2)

amount\_net decimal(10,2)

installments integer

payment\_method varchar

gateway\_transaction\_id varchar

card\_brand varchar

card\_last4 varchar

status payment\_status

processed\_at timestamp

created\_at timestamp

```

```

commission\_splits

id integer

transaction\_id integer

recipient\_id integer

recipient\_type split\_recipient\_type

percentage decimal(5,2)

amount decimal(10,2)

status varchar

created\_at timestamp

```

```

refunds

id integer

transaction\_id integer

amount\_refunded decimal(10,2)

reason varchar

requested\_by integer

created\_at timestamp

```

```

monthly\_reports

id integer

professional\_id integer

month integer

year integer

total\_appointments integer

total\_commission decimal(10,2)

status varchar

paid\_at timestamp

```



```

1

```

```

1

```

```

0..

```

```

\*

1

```

```

\*

```

```

1

```

```

\*

```

```

0..

```

```

\*

```

```

\* 0..

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

0..

```

```

\*

```

```

users

id integer

name varchar

email varchar

password varchar

role user\_role

cpf varchar

phone varchar

created\_at timestamp

updated\_at timestamp

```

```

professional\_details

id integer

user\_id integer

specialty specialty\_type

registration\_number varchar

council varchar

consultation\_price decimal(10,2)

commission\_percentage decimal(5,2)

```

```

availabilities

id integer

professional\_id integer

day\_of\_week integer

start\_time time

end\_time time

is\_active boolean appointments

id integer

patient\_id integer

professional\_id integer

date date

time time

duration\_minutes integer

type appointment\_type

status appointment\_status

price decimal(10,2)

payment\_status payment\_status

video\_link varchar

room\_number varchar

cancellation\_reason varchar

cancelled\_by integer

created\_at timestamp

updated\_at timestamp

```

exam\_catalog



id integer



name varchar



type exam\_type



base\_price decimal(10,2)



description varchar



```

exam\_requests

id integer

appointment\_id integer

patient\_id integer

requesting\_professional\_id integer

exam\_catalog\_id integer

clinical\_indication text

status exam\_status

price decimal(10,2)

payment\_status payment\_status

scheduled\_date datetime

result\_file\_url varchar

result\_text text

lab\_tech\_id integer

created\_at timestamp

```

```

prescriptions

id integer

appointment\_id integer

patient\_id integer

professional\_id integer

medication\_name varchar

dosage varchar

instructions text

is\_controlled boolean

pdf\_url varchar

created\_at timestamp

```

```

transactions

id integer

type transaction\_type

reference\_id integer

payer\_id integer

amount\_gross decimal(10,2)

mdr\_fee decimal(10,2)

amount\_net decimal(10,2)

installments integer

payment\_method varchar

gateway\_transaction\_id varchar

card\_brand varchar

card\_last4 varchar

status payment\_status

processed\_at timestamp

created\_at timestamp

```

```

commission\_splits

id integer

transaction\_id integer

recipient\_id integer

recipient\_type split\_recipient\_type

percentage decimal(5,2)

amount decimal(10,2)

status varchar

created\_at timestamp

```

```

refunds

id integer

transaction\_id integer

amount\_refunded decimal(10,2)

reason varchar

requested\_by integer

created\_at timestamp

```

```

monthly\_reports

id integer

professional\_id integer

month integer

year integer

total\_appointments integer

total\_commission decimal(10,2)

status varchar

paid\_at timestamp

```



\## Enum user\_role {



\## patient



\## receptionist



\## lab\_tech



\## health\_professional



\## clinic\_admin



\## system\_admin



\## }



\## Enum specialty\_type {



\## psicologia



\## nutricao



\## fonoaudiologia



\## fisioterapia



\## clinica\_medica



\## cardiologia



\## oftalmologia



\## urologia



\## cirurgia\_geral



\## ortopedia



\## neurologia



\## }



\## Enum appointment\_type {



\## presencial



\## online



\## }



\## Enum appointment\_status {



\## scheduled



\## confirmed



\## waiting



\## in\_progress



\## completed



\## no\_show



\## cancelled\_by\_patient



\## cancelled\_by\_clinic



\## rescheduled



\## }



\## Enum exam\_type {



\## blood



\## image



\## }



\## Enum exam\_status {



\## pending\_payment



\## paid\_pending\_schedule



\## scheduled



\## in\_analysis



\## ready



\## released



\## cancelled



\## }



\## Enum transaction\_type {



\## appointment\_payment



\## exam\_payment



\## refund



\## }





\## Enum payment\_status {



\## pending



\## processing



\## paid



\## failed



\## refunded



\## partially\_refunded



\## }



\## Enum split\_recipient\_type {



\## professional



\## clinic



\## system



\## }





Este documento apresenta a estrutura completa do banco de dados do sistema MedClinic,

um software de gestão para clínicas médicas com suporte a pagamentos online,

agendamento de consultas, gestão de exames e sistema automático de comissões. O banco

de dados utiliza SQLite como gerenciador.



Descrição: Armazena informações de todos os usuários do sistema, incluindo pacientes,

prossionais de saúde, recepcionistas e administradores.



\# MedClinic - Especicação de Entidades e



\# Diagrama DER



\## Introdução



\## 1. Entidades e Campos



```

1.1 Tabela: users

```



```

Cam

po

Tipo

Restriçõ

es

Descrição

```

```

id

```

\#### INTE



\#### GER



```

PK, Auto-

increme

nt

```

```

Identicador único do usuário

```

```

name

```

\#### VARC



\#### HAR



\#### NOT



\#### NULL



```

Nome completo do usuário

```

```

email

```

\#### VARC



\#### HAR



\#### NOT



\#### NULL,



\#### UNIQUE



```

Email para login e comunicação

```

```

pass

word

```

\#### VARC



\#### HAR



\#### NOT



\#### NULL



```

Senha criptografada (Bcrypt)

```

```

role

```

\#### ENU



\#### M



\#### NOT



\#### NULL



```

Papel do usuário (patient, receptionist,

lab\_tech, health\_professional,

clinic\_admin, system\_admin)

```

```

cpf

```

\#### VARC



\#### HAR



\#### UNIQUE,



\#### NULLAB



\#### LE



```

CPF para validação (pacientes e

prossionais)

```

```

phon

e

```

\#### VARC



\#### HAR



\#### NULLAB



\#### LE



```

Telefone de contato

```

```

creat

ed\_at

```

\#### TIME



\#### STAM



\#### P



\#### DEFAULT



\#### NOW()



```

Data/hora de criação

```

```

upda

ted\_a

t

```

\#### TIME



\#### STAM



\#### P



\#### NULLAB



\#### LE



```

Data/hora de última atualização

```

Valores de role:



```

patient - Paciente

receptionist - Recepcionista

lab\_tech - Técnico de Laboratório

health\_professional - Prossional de Saúde (médico, psicólogo, nutricionista, etc.)

clinic\_admin - Administrador da Clínica

system\_admin - Administrador do Sistema

```



Descrição: Detalhes especícos de prossionais de saúde, incluindo especialidade, registro

prossional e comissões.



```

Campo Tipo Restrições Descrição

```

```

id

```

\#### INTEGE



\#### R



```

PK, Auto-

increment

```

```

Identicador único

```

```

user\_id

```

\#### INTEGE



\#### R



```

FK → users.id,

NOT NULL

```

```

Referência ao

prossional

```

```

specialty ENUM NOT NULL Especialidade médica

```

```

registration\_

number

```

\#### VARCHA



\#### R



\#### NOT NULL



```

Número de registro

(CRM, CRP, etc.)

```

```

council

```

\#### VARCHA



\#### R



\#### NULLABLE



```

Conselho regulador

(CFM, CFP, CREFITO,

etc.)

```

```

consultation\_

price

```

\#### DECIMA



\#### L(10,2)



```

NOT NULL Preço base da consulta

```

```

commission\_

percentage

```

\#### DECIMA



\#### L(5,2)



\#### DEFAULT



\#### 60.



```

Percentual de comissão

(padrão 60%)

```

Valores de specialty:



```

psicologia - Psicologia

nutricao - Nutrição

fonoaudiologia - Fonoaudiologia

sioterapia - Fisioterapia

clinica\_medica - Clínica Médica

cardiologia - Cardiologia

oftalmologia - Oftalmologia

urologia - Urologia

cirurgia\_geral - Cirurgia Geral

ortopedia - Ortopedia

neurologia - Neurologia

```

Descrição: Dene horários e dias de trabalho para cada prossional, permitindo gerenciar

sua agenda.



```

1.2 Tabela: professional\_details

```

```

1.3 Tabela: availabilities

```



```

Campo Tipo Restrições Descrição

```

```

id

```

\#### INTEG



\#### ER



```

PK, Auto-

increment

Identicador único

```

```

professio

nal\_id

```

\#### INTEG



\#### ER



\#### FK →



```

users.id

```

```

Prossional que trabalha neste

horário

```

```

day\_of\_w

eek

```

\#### INTEG



\#### ER



\#### NOT NULL



```

Dia da semana (0=Domingo,

1=Segunda, ..., 6=Sábado)

```

```

start\_tim

e

```

```

TIME NOT NULL Hora de início do atendimento

```

```

end\_time TIME NOT NULL

Hora de término do

atendimento

```

```

is\_active

```

\#### BOOL



\#### EAN



\#### DEFAULT



\#### TRUE



```

Indica se este horário está ativo

```

Descrição: Consultas agendadas entre pacientes e prossionais de saúde (presenciais ou

online).



```

1.4 Tabela: appointments

```



```

Campo Tipo Restrições Descrição

```

id INTEGER

PK, Auto-

increment

Identicador único



patient\_id INTEGER

FK → users.id,

NOT NULL



```

Paciente que fez o

agendamento

```

professiona

l\_id



\#### INTEGER



```

FK → users.id,

NOT NULL

Prossional responsável

```

date DATE NOT NULL Data da consulta



time TIME NOT NULL Hora da consulta



duration\_m

inutes

INTEGER DEFAULT 30 Duração em minutos



type ENUM NOT NULL



```

Tipo: presencial ou

online

```

status ENUM



\#### DEFAULT



```

'scheduled'

```

```

Estado atual da consulta

```

price



\#### DECIMA



\#### L(10,2)



\#### NOT NULL



```

Preço congelado no

agendamento

```

payment\_st

atus



\#### ENUM



\#### DEFAULT



```

'pending'

Status do pagamento

```

video\_link



\#### VARCHA



\#### R



\#### NULLABLE



```

Link da videochamada

(para telemedicina)

```

room\_num

ber



\#### VARCHA



\#### R



\#### NULLABLE



```

Número da sala (para

presencial)

```

cancellatio

n\_reason



\#### VARCHA



\#### R



```

NULLABLE Motivo do cancelamento

```

cancelled\_b

y



\#### INTEGER



```

FK → users.id,

NULLABLE

Quem cancelou

```

created\_at



\#### TIMESTA



\#### MP



\#### DEFAULT



\#### NOW()



```

Data/hora de criação

```

updated\_at



\#### TIMESTA



\#### MP



\#### NULLABLE



```

Data/hora de

atualização

```



Valores de type: presencial, online



Valores de status: scheduled, conrmed, waiting, in\_progress, completed, no\_show,

cancelled\_by\_patient, cancelled\_by\_clinic, rescheduled



Valores de payment\_status: pending, processing, paid, failed, refunded, partially\_refunded



Descrição: Catálogo padronizado de exames disponíveis com preços base.



```

Campo Tipo Restrições Descrição

```

```

id INTEGER

```

```

PK, Auto-

increment

```

```

Identicador

único

```

```

name VARCHAR NOT NULL Nome do exame

```

```

type ENUM NOT NULL

```

```

Tipo: blood ou

image

```

```

base\_pric

e

```

\#### DECIMAL(10,



\#### 2)



\#### NOT NULL



```

Preço base do

exame

```

```

descriptio

n

```

\#### VARCHAR NULLABLE



```

Descrição

detalhada

```

Valores de type: blood, image



Descrição: Requisições de exames feitas por prossionais de saúde para pacientes.



```

1.5 Tabela: exam\_catalog

```

```

1.6 Tabela: exam\_requests

```



```

Campo Tipo Restrições Descrição

```

```

id INTEGER

PK, Auto-

increment

Identicador único

```

```

appointment\_i

d

```

\#### INTEGER



\#### FK →



```

appointments.id

```

```

Consulta

relacionada

```

```

patient\_id INTEGER FK → users.id

```

```

Paciente que fará o

exame

```

```

requesting\_pro

fessional\_id

```

```

INTEGER FK → users.id

Prossional que

solicitou

```

```

exam\_catalog\_i

d

```

\#### INTEGER



\#### FK →



```

exam\_catalog.id

```

```

Referência ao

catálogo

```

```

clinical\_indicat

ion

```

\#### TEXT NOT NULL



```

Justicativa clínica

obrigatória

```

```

status ENUM

```

\#### DEFAULT



```

'pending\_payme

nt'

```

```

Estado do exame

```

```

price

```

\#### DECIMA



\#### L(10,2)



```

NOT NULL Preço do exame

```

```

payment\_statu

s

```

\#### ENUM



\#### DEFAULT



```

'pending'

```

```

Status do

pagamento

```

```

scheduled\_date

```

\#### DATETI



\#### ME



\#### NULLABLE



```

Data/hora

agendada para o

exame

```

```

result\_le\_url

```

\#### VARCHA



\#### R



\#### NULLABLE



```

URL do arquivo de

resultado

```

```

result\_text TEXT NULLABLE Texto do laudo

```

```

lab\_tech\_id INTEGER

```

```

FK → users.id,

NULLABLE

```

```

Técnico que

processou

```

```

created\_at

```

\#### TIMESTA



\#### MP



\#### DEFAULT NOW()



```

Data/hora de

criação

```

Valores de status: pending\_payment, paid\_pending\_schedule, scheduled, in\_analysis,

ready, released, cancelled





Descrição: Prescrições médicas e receituário eletrônico.



```

Campo Tipo Restrições Descrição

```

```

id INTEGER

```

```

PK, Auto-

increment

Identicador único

```

```

appointment

\_id

```

\#### INTEGER



\#### FK →



```

appointments.id

```

```

Consulta relacionada

```

```

patient\_id INTEGER FK → users.id Paciente prescritor

```

```

professional\_

id

```

```

INTEGER FK → users.id

Prossional que

prescreveu

```

```

medication\_

name

```

\#### VARCHA



\#### R



\#### NOT NULL



```

Nome do

medicamento

```

```

dosage

```

\#### VARCHA



\#### R



```

NULLABLE Dosagem (ex: 500mg)

```

```

instructions TEXT NULLABLE Instruções de uso

```

```

is\_controlled

```

\#### BOOLEA



\#### N



\#### DEFAULT FALSE



```

Indica se é receita

controlada

```

```

pdf\_url

```

\#### VARCHA



\#### R



\#### NULLABLE



```

URL do PDF da

prescrição

```

```

created\_at

```

\#### TIMESTA



\#### MP



\#### DEFAULT



\#### NOW()



```

Data/hora de criação

```

Descrição: Registro de todas as transações nanceiras (pagamentos e reembolsos).



```

1.7 Tabela: prescriptions

```

```

1.8 Tabela: transactions

```



```

Campo Tipo Restrições Descrição

```

```

id INTEGER

PK, Auto-

increment

Identicador único

```

```

type ENUM NOT NULL Tipo de transação

```

```

reference\_id INTEGER NULLABLE

ID da consulta ou

exame

```

```

payer\_id INTEGER FK → users.id

Paciente que

pagou

```

```

amount\_gross

```

\#### DECIMAL(



\#### 10,2)



```

NOT NULL Valor bruto

```

```

mdr\_fee

```

\#### DECIMAL(



\#### 10,2)



\#### NOT NULL



```

Taxa do gateway

(MDR)

```

```

amount\_net

```

\#### DECIMAL(



\#### 10,2)



\#### NOT NULL



```

Valor líquido

(bruto - MDR)

```

```

installments INTEGER DEFAULT 1

Número de

parcelas

```

```

payment\_meth

od

```

\#### VARCHAR



\#### DEFAULT



```

'credit\_card'

```

```

Método de

pagamento

```

```

gateway\_transa

ction\_id

```

\#### VARCHAR NULLABLE



```

ID da transação no

gateway

```

```

card\_brand VARCHAR NULLABLE Bandeira do cartão

```

```

card\_last4 VARCHAR NULLABLE

Últimos 4 dígitos

do cartão

```

```

status ENUM

```

\#### DEFAULT



```

'processing'

```

```

Status do

pagamento

```

```

processed\_at

```

\#### TIMESTA



\#### MP



\#### NULLABLE



```

Data/hora de

processamento

```

```

created\_at

```

\#### TIMESTA



\#### MP



\#### DEFAULT



\#### NOW()



```

Data/hora de

criação

```

Valores de type: appointment\_payment, exam\_payment, refund



Valores de status: pending, processing, paid, failed, refunded, partially\_refunded





Descrição: Divisão automática de receita entre prossional, clínica e sistema (60/35/5).



```

Campo Tipo Restrições Descrição

```

```

id INTEGER

```

```

PK, Auto-

increment

Identicador único

```

```

transacti

on\_id

```

\#### INTEGER



\#### FK →



```

transactions.i

d

```

```

Transação relacionada

```

```

recipient

\_id

```

\#### INTEGER NULLABLE



```

ID do destinatário

(prossional ou clínica)

```

```

recipient

\_type

```

\#### ENUM NOT NULL



```

Tipo: professional, clinic,

system

```

```

percenta

ge

```

\#### DECIMAL



\#### (5,2)



```

NOT NULL Percentual da divisão

```

```

amount

```

\#### DECIMAL



\#### (10,2)



```

NOT NULL Valor em reais

```

```

status VARCHAR

```

\#### DEFAULT



```

'pending'

Status: pending, paid

```

```

created\_a

t

```

\#### TIMESTA



\#### MP



\#### DEFAULT



\#### NOW()



```

Data/hora de criação

```

Valores de recipient\_type: professional, clinic, system



Descrição: Controle de reembolsos e devoluções.



```

1.9 Tabela: commission\_splits

```

```

1.10 Tabela: refunds

```



```

Campo Tipo Restrições Descrição

```

```

id INTEGER

PK, Auto-

increment

```

```

Identicador

único

```

```

transaction\_id INTEGER

```

\#### FK →



```

transactions.id

```

```

Transação

reembolsada

```

```

amount\_refun

ded

```

\#### DECIMAL(



\#### 0,2)



\#### NOT NULL



```

Valor

reembolsado

```

```

reason VARCHAR NOT NULL

Motivo do

reembolso

```

```

requested\_by INTEGER FK → users.id Quem solicitou

```

```

created\_at

```

\#### TIMESTAM



\#### P



\#### DEFAULT



\#### NOW()



```

Data/hora de

criação

```

Descrição: Relatórios mensais de comissões para prossionais de saúde.



```

Campo Tipo Restrições Descrição

```

```

id INTEGER

```

```

PK, Auto-

increment

Identicador único

```

```

professional\_i

d

```

```

INTEGER FK → users.id

Prossional

referente

```

```

month INTEGER NOT NULL Mês (1-12)

```

```

year INTEGER NOT NULL Ano

```

```

total\_appoint

ments

```

\#### INTEGER NOT NULL



```

Total de consultas

realizadas

```

```

total\_commiss

ion

```

\#### DECIMAL(



\#### 10,2)



\#### NOT NULL



```

Valor total de

comissões

```

```

status VARCHAR

```

\#### DEFAULT



```

'generated'

```

```

Status: generated,

paid

```

```

paid\_at

```

\#### TIMESTAM



\#### P



\#### NULLABLE



```

Data/hora do

pagamento

```

```

1.11 Tabela: monthly\_reports

```



┌────────────────────────────────────────────────────────────

─────────────────┐

│ MEDCLINIC │

│ Diagrama Entidade-Relacionamento │

└────────────────────────────────────────────────────────────

─────────────────┘



```

┌──────────────────────┐

│ users │

├──────────────────────┤

│ id (PK) │

│ name │

│ email │

│ password │

│ role │

│ cpf │

│ phone │

│ created\_at │

│ updated\_at │

└──────────────────────┘

│

┌─────────────────┼─────────────────┐

│ │ │

┌─────────▼───────┐ ┌─────▼──────────┐ ┌──▼────────

│prof\_details │ │availabilities │ │professional\_details

├─────────────────┤ ├────────────────┤ ├─────────────

│ id (PK) │ │ id (PK) │ │ id (PK) │

│ user\_id (FK) │ │ prof\_id (FK) │ │ user\_id (FK) │

│ specialty │ │ day\_of\_week │ │ specialty │

│ registration\_no │ │ start\_time │ │ registration\_no │

│ council │ │ end\_time │ │ council │

│ cons\_price │ │ is\_active │ │ cons\_price │

│ commission\_% │ └────────────────┘ │ commission\_% │

└─────────────────┘ └──────────────────┘

│

│

┌─────────┴─────────┐

```

\### 2. Diagrama de Entidade-Relacionamento (DER)





│ │



┌───▼─────────────┐ ┌──▼────────────────┐



│ appointments │ │ exam\_requests │



├─────────────────┤ ├───────────────────┤



│ id (PK) │ │ id (PK) │



│ patient\_id (FK) │ │ appt\_id (FK) │



│ prof\_id (FK) │ │ patient\_id (FK) │



│ date │ │ req\_prof\_id (FK) │



│ time │ │ exam\_cat\_id (FK) │



│ duration\_min │ │ clinical\_ind │



│ type │ │ status │



│ status │ │ price │



│ price │ │ payment\_status │



│ payment\_status │ │ scheduled\_date │



│ video\_link │ │ result\_le\_url │



│ room\_number │ │ result\_text │



│ cancel\_reason │ │ lab\_tech\_id (FK) │



│ cancel\_by (FK) │ └───────────────────┘



│ created\_at │ │



│ updated\_at │ │



└────────┬────────┘ │



│ │



│ ┌──────────▼────────┐



│ │ exam\_catalog │



│ ├───────────────────┤



│ │ id (PK) │



│ │ name │



│ │ type │



│ │ base\_price │



│ │ description │



│ └───────────────────┘



│



┌─────┴──────────┬──────────────┐



│ │ │



┌──▼────────────┐ ┌▼────────────┐ ┌▼────────────────┐



│prescriptions │ │transactions │ │commission\_splits│



├───────────────┤ ├─────────────┤ ├─────────────────┤



│ id (PK) │ │ id (PK) │ │ id (PK) │





│ appt\_id (FK) │ │ type │ │ trans\_id (FK) │



│ patient\_id(FK)│ │ reference\_id│ │ recipient\_id │



│ prof\_id (FK) │ │ payer\_id(FK)│ │ recipient\_type │



│ med\_name │ │ amount\_gross│ │ percentage │



│ dosage │ │ mdr\_fee │ │ amount │



│ instructions │ │ amount\_net │ │ status │



│ is\_controlled │ │ installments│ │ created\_at │



│ pdf\_url │ │ payment\_meth│ └─────────────────┘



│ created\_at │ │ gateway\_id │



└───────────────┘ │ card\_brand │



│ card\_last4 │



│ status │



│ processed\_at│



│ created\_at │



└──────┬──────┘



│



┌──────▼───────┐



│ refunds │



├──────────────┤



│ id (PK) │



│ trans\_id(FK) │



│ amount\_ref │



│ reason │



│ req\_by (FK) │



│ created\_at │



└──────────────┘



┌──────────────────────┐



│ monthly\_reports │



├──────────────────────┤



│ id (PK) │



│ prof\_id (FK) │



│ month │



│ year │



│ total\_appointments │



│ total\_commission │



│ status │





```

│ paid\_at │

└──────────────────────┘

```

LEGENDA:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PK (Primary Key) → Chave primária

FK (Foreign Key) → Chave estrangeira / Referência

→ → Relacionamento um-para-muitos

→ Relacionamento muitos-para-um



```

users → professional\_details: Um prossional (1:1)

Um usuário com role = health\_professional tem exatamente um registro em

professional\_details

users → availabilities: Um prossional pode ter múltiplos horários (1:N)

Um prossional dene seus horários de trabalho

```

```

users → appointments: Um paciente pode agendar múltiplas consultas (1:N)

users → appointments: Um prossional realiza múltiplas consultas (1:N)

appointments → prescriptions: Uma consulta pode gerar múltiplas prescrições

(1:N)

appointments → exam\_requests: Uma consulta pode ter múltiplos exames

solicitados (1:N)

```

```

users → exam\_requests: Um paciente tem múltiplos exames (1:N)

users → exam\_requests: Um prossional solicita múltiplos exames (1:N)

exam\_catalog → exam\_requests: Um tipo de exame pode ter múltiplas requisições

(1:N)

```

```

transactions → commission\_splits: Uma transação gera múltiplos splits (1:N)

transactions → refunds: Uma transação pode ter múltiplos reembolsos (1:N)

users → transactions: Um paciente realiza múltiplas transações (1:N)

users → monthly\_reports: Um prossional tem múltiplos relatórios mensais (1:N)

```

\### 3. Relacionamentos Principais



```

3.1 Users e suas Extensões

```

```

3.2 Consultas

```

```

3.3 Exames

```

```

3.4 Financeiro

```

\### 4. Resumo das Entidades





```

Entidade Registros Propósito

```

```

users Variável

Armazena todos os usuários do

sistema

```

```

professional\_det

ails

```

\#### N



```

prossionais

```

```

Detalhes especícos de

prossionais

```

```

availabilities N horários

```

```

Agenda de trabalho dos

prossionais

```

```

appointments N consultas Agendamentos de consultas

```

```

exam\_catalog N exames Catálogo padronizado de exames

```

```

exam\_requests

```

\#### N



```

requisições

```

```

Requisições de exames para

pacientes

```

```

prescriptions

```

\#### N



```

prescrições

Receitas médicas digitais

```

```

transactions

```

\#### N



```

pagamentos

```

```

Todas as transações nanceiras

```

```

commission\_split

s

N divisões Distribuição de receita (60/35/5)

```

```

refunds

```

\#### N



```

reembolsos

Controle de devoluções

```

```

monthly\_reports

```

```

1 por

mês/prof

Relatórios mensais de comissões

```

Para otimizar performance:



CREATE INDEX idx\_users\_email ON users(email);

CREATE INDEX idx\_users\_role ON users(role);

CREATE INDEX idx\_appointments\_patient ON appointments(patient\_id);

CREATE INDEX idx\_appointments\_professional ON appointments(professional\_id);

CREATE INDEX idx\_appointments\_date\_status ON appointments(date, status);

CREATE INDEX idx\_exam\_requests\_patient ON exam\_requests(patient\_id);

CREATE INDEX idx\_exam\_requests\_status ON exam\_requests(status);

CREATE INDEX idx\_transactions\_payer ON transactions(payer\_id);

CREATE INDEX idx\_transactions\_status ON transactions(status);

CREATE INDEX idx\_commission\_splits\_recipient ON commission\_splits(recipient\_id);



\### 5. Índices Recomendados





CREATE INDEX idx\_monthly\_reports\_professional\_month ON

monthly\_reports(professional\_id, year, month);



Este diagrama DER representa a estrutura completa do sistema MedClinic, integrando

gerenciamento de usuários, agendamentos, exames, prescrições e um sistema robusto de

pagamentos com divisão automática de receita. A normalização de dados garante

integridade referencial e eciência nas consultas.



\### Conclusão





