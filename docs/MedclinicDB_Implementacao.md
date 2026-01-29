\## Sistema de Gest ̃ao de Cl ́ınicas M ́edicas



Resumo



```

Este documento apresenta a especifica ̧c ̃ao completa da implementa ̧c ̃ao do banco de

dados MedClinic, um sistema de gest ̃ao de cl ́ınicas m ́edicas desenvolvido com SQLite e

TypeScript. A arquitetura foi projetada com foco em integridade de dados, rastreabili-

dade, seguran ̧ca e performance, respeitando todas as 28 regras de neg ́ocio especificadas.

```

&nbsp;        - Vers ̃ao: 1.0 Data: Janeiro

&nbsp;           - Janeiro

&nbsp;              - Vers ̃ao 1.

\- 1 Vis ̃ao Geral da Arquitetura Sum ́ario

&nbsp;  - 1.1 Tecnologias

&nbsp;  - 1.2 Mudan ̧cas em Rela ̧c ̃ao ao Modelo Original

\- 2 Diagrama Entidade-Relacionamento (DER)

&nbsp;  - 2.1 Blocos Principais

\- 3 Especifica ̧c ̃ao das Tabelas com Exemplos TypeScript

&nbsp;  - 3.1 Bloco 1: Usu ́arios e Profissionais

&nbsp;     - 3.1.1 Tabela: users

&nbsp;     - 3.1.2 Exemplo de Inser ̧c ̃ao em TypeScript

&nbsp;     - 3.1.3 Tabela: professionaldetails

&nbsp;     - 3.1.4 Tabela: availabilities

&nbsp;  - 3.2 Bloco 2: Consultas (Core do Sistema)

&nbsp;     - 3.2.1 Tabela: appointments

&nbsp;  - 3.3 Bloco 3: Exames e Prescri ̧c ̃oes

&nbsp;     - 3.3.1 Tabela: examcatalog

&nbsp;     - 3.3.2 Tabela: examrequests

&nbsp;     - 3.3.3 Tabela: prescriptions

&nbsp;  - 3.4 Bloco 4: Financeiro (Pagamentos e Comissionamento)

&nbsp;     - 3.4.1 Tabela: transactions

&nbsp;     - 3.4.2 Tabela: commissionsplits

&nbsp;     - 3.4.3 Tabela: refunds

&nbsp;     - 3.4.4 Tabela: monthlyreports

\- 4 Setup de TypeScript com SQLite

&nbsp;  - 4.1 Configura ̧c ̃ao Recomendada

&nbsp;  - 4.2 Package.json Recomendado

\- 5 Conclus ̃ao





\## 1 Vis ̃ao Geral da Arquitetura Sum ́ario



\#### O banco de dados MedClinic foi modelado em SQLite com foco em:



\#### • Integridade de dados: Uso extensivo de chaves estrangeiras e enumera ̧c ̃oes



\#### • Rastreabilidade: Hist ́orico completo de transa ̧c ̃oes e opera ̧c ̃oes



\#### • Seguran ̧ca: Separa ̧c ̃ao de responsabilidades entre entidades



\#### • Performance: ́Indices estrat ́egicos e estrutura desnormalizada apenas quando necess ́ario



\### 1.1 Tecnologias



\#### • Banco de Dados: SQLite (arquivo ́unico em /database/medclinic.db)



\#### • Backend: Node.js + Express.js



\#### • ORM/Driver: better-sqlite3 (s ́ıncrono) ou sqlite3 (ass ́ıncrono)



\#### • Linguagem: TypeScript com tipagem forte



\#### • Valida ̧c ̃ao: Implementada manualmente (sem bibliotecas externas)



\### 1.2 Mudan ̧cas em Rela ̧c ̃ao ao Modelo Original



\#### O modelo descrito nas regras de neg ́ocio passou por evolu ̧c ̃oes estrat ́egicas:



```

Aspecto Original Modelagem Final Justificativa

Hor ́arios Profissi-

onal

```

```

String/texto Tabela availabilities Queries complexas sem

processamento

Cat ́alogo Exames Manual Tabela examcatalog Padroniza e facilita auditoria

Status Consulta 9 valores lista-

dos

```

```

Enum appointmentstatus Consistˆencia e previne

estados inv ́alidos

Rastreamento Pa-

gamento

```

```

Monol ́ıtico transactions +

commissionsplits

```

```

Separa o quˆe do como

```

```

Pre ̧co Congelado Mencionado Campos em appointments e

examrequests

```

```

Preserva hist ́orico de pre ̧cos

```

\#### Tabela 1: Evolu ̧c ̃ao do Modelo de Dados





\## 2 Diagrama Entidade-Relacionamento (DER)



\### 2.1 Blocos Principais



\#### O modelo est ́a organizado em 4 blocos principais:



\#### 1. Usu ́arios \& Permiss ̃oes: Gest ̃ao de acesso e dados profissionais



\#### 2. Consultas (CORE): N ́ucleo do sistema de agendamentos



\#### 3. Exames e Prescri ̧c ̃oes: Pedidos m ́edicos e resultados



\#### 4. Financeiro: Pagamentos, comiss ̃oes e relat ́orios





\## 3 Especifica ̧c ̃ao das Tabelas com Exemplos TypeScript



\### 3.1 Bloco 1: Usu ́arios e Profissionais



\#### 3.1.1 Tabela: users



\#### Prop ́osito: Armazena todos os usu ́arios do sistema com seus dados b ́asicos e controle de acesso



\#### (6 roles diferentes).



\#### Coment ́arios Importantes:



\#### • password: SEMPRE armazenar hash bcrypt. Nunca texto plano.



\#### • email: UNIQUE garante que n ̃ao h ́a duplicatas



\#### • role: Enum CHECK garante apenas 6 valores v ́alidos



\#### • createdat/updatedat: Rastreabilidade completa



\#### 3.1.2 Exemplo de Inser ̧c ̃ao em TypeScript



1 interface User {

2 id?: number;

3 name: string;

4 email: string;

5 password: string; // Hash bcrypt

6 role: ’patient ’ | ’receptionist ’ | ’lab\_tech ’ |

7 ’health\_professional ’ | ’clinic\_admin ’ | ’system\_admin ’;

8 cpf?: string;

9 phone ?: string;

10 created\_at ?: string;

11 updated\_at ?: string;

12 }



\#### Listing 1: Interface de Usu ́ario



1 class UserRepository {

2 private db: Database;

3

4 // Inserir novo paciente

5 createPatient(userData: User): number {

6 const stmt = this.db.prepare(‘

7 INSERT INTO users (name , email , password , role , cpf , phone ,

created\_at)

8 VALUES (?, ?, ?, ?, ?, ?, CURRENT\_TIMESTAMP)

9 ‘);

10

11 const result = stmt.run(

12 userData.name ,

13 userData.email ,

14 userData.password , // Deve ser hash bcrypt

15 ’patient ’,

16 userData.cpf ,

17 userData.phone

18 );





19 return result.lastInsertRowid as number;

20 }

21

22 // Inserir novo m ́edico

23 createHealthProfessional(userData: User): number {

24 const stmt = this.db.prepare(‘

25 INSERT INTO users (name , email , password , role , cpf , phone)

26 VALUES (?, ?, ?, ?, ?, ?)

27 ‘);

28

29 const result = stmt.run(

30 userData.name ,

31 userData.email ,

32 userData.password , // Hash bcrypt

33 ’health\_professional ’,

34 userData.cpf ,

35 userData.phone

36 );

37 return result.lastInsertRowid as number;

38 }

39

40 // Buscar por email (para login)

41 findByEmail(email: string): User | null {

42 const stmt = this.db.prepare(‘SELECT \* FROM users WHERE email =

?‘);

43 return stmt.get(email) as User | null;

44 }

45

46 // Buscar por ID

47 findById(id: number): User | null {

48 const stmt = this.db.prepare(‘SELECT \* FROM users WHERE id = ?‘);

49 return stmt.get(id) as User | null;

50 }

51 }

52

53 // Uso

54 const userRepo = new UserRepository(db);

55

56 // Inserir paciente

57 const patientId = userRepo.createPatient ({

58 name: ’Maria Silva ’,

59 email: ’maria@email.com’,

60 password: ’$2b10$hash\_bcrypt\_aqui ’, // Nunca texto plano!

61 role: ’patient ’,

62 cpf: ’12345678901 ’,

63 phone: ’11987654321 ’

64 });

65

66 // Inserir m ́edico

67 const docId = userRepo.createHealthProfessional ({

68 name: ’Dr. Jo~ao Cardiologista ’,

69 email: ’joao@clinica.com’,

70 password: ’$2b10$hash\_bcrypt\_aqui ...’,





71 role: ’health\_professional ’,

72 cpf: ’98765432100 ’,

73 phone: ’1133334444 ’

74 });



\#### Listing 2: Reposit ́orio de Usu ́arios



\#### 3.1.3 Tabela: professionaldetails



\#### Prop ́osito: Estende a tabela users com informa ̧c ̃oes espec ́ıficas de profissionais de sa ́ude (es-



\#### pecialidade, CRM, precifica ̧c ̃ao).



1 interface ProfessionalDetails {

2 id?: number;

3 user\_id: number;

4 specialty: ’psicologia ’ | ’nutricao ’ | ’fonoaudiologia ’ |

’fisioterapia ’ |

5 ’clinica\_medica ’ | ’cardiologia ’ | ’oftalmologia ’ |

’urologia ’ |

6 ’cirurgia\_geral ’ | ’ortopedia ’ | ’neurologia ’;

7 registration\_number: string;

8 council ?: string;

9 consultation\_price: number;

10 commission\_percentage ?: number;

11 }



\#### Listing 3: Interface de Detalhes Profissionais



1 class ProfessionalDetailsRepository {

2 private db: Database;

3

4 // Inserir especialidade de um m ́edico

5 create(details: ProfessionalDetails): number {

6 const stmt = this.db.prepare(‘

7 INSERT INTO professional\_details (

8 user\_id , specialty , registration\_number , council ,

9 consultation\_price , commission\_percentage

10 ) VALUES (?, ?, ?, ?, ?, ?)

11 ‘);

12

13 const result = stmt.run(

14 details.user\_id ,

15 details.specialty ,

16 details.registration\_number ,

17 details.council || null ,

18 details.consultation\_price ,

19 details.commission\_percentage || 60.

20 );

21 return result.lastInsertRowid as number;

22 }

23

24 // Buscar por user\_id

25 findByUserId(userId: number): ProfessionalDetails | null {

26 const stmt = this.db.prepare(





27 ‘SELECT \* FROM professional\_details WHERE user\_id = ?‘

28 );

29 return stmt.get(userId) as ProfessionalDetails | null;

30 }

31

32 // Buscar por especialidade

33 findBySpecialty(specialty: string): ProfessionalDetails \[] {

34 const stmt = this.db.prepare(

35 ‘SELECT \* FROM professional\_details WHERE specialty = ?‘

36 );

37 return stmt.all(specialty) as ProfessionalDetails \[];

38 }

39 }

40

41 // Uso

42 const profDetailsRepo = new ProfessionalDetailsRepository(db);

43

44 // Inserir especialidade do Dr. Jo~ao

45 profDetailsRepo.create ({

46 user\_id: 2,

47 specialty: ’cardiologia ’,

48 registration\_number: ’CRM123456/SP’,

49 council: ’Conselho Regional de Medicina de S~ao Paulo ’,

50 consultation\_price: 350.00 ,

51 commission\_percentage: 60.

52 });

53

54 // Inserir especialidade da Psic ́ologa

55 profDetailsRepo.create ({

56 user\_id: 3,

57 specialty: ’psicologia ’,

58 registration\_number: ’CRP123456/SP’,

59 council: ’Conselho Regional de Psicologia ’,

60 consultation\_price: 120.00 ,

61 commission\_percentage: 60.

62 });



\#### Listing 4: Reposit ́orio de Detalhes Profissionais



\#### Coment ́arios Importantes:



\#### • consultationprice: Pre ̧co CONGELADO quando agendamento ́e criado (n ̃ao se altera



\#### com mudan ̧cas futuras)



\#### • commissionpercentage: Pode ser customizado por profissional, padr ̃ao ́e 60%



\#### 3.1.4 Tabela: availabilities



\#### Prop ́osito: Define a agenda semanal de cada profissional (RN-01: Disponibilidade de Hor ́arios).



```

1 interface Availability {

2 id?: number;

3 professional\_id: number;

4 day\_of\_week: number; // 0-

5 start\_time: string; // "HH:MM"

```



```

6 end\_time: string; // "HH:MM"

7 is\_active ?: boolean;

8 }

```

\#### Listing 5: Interface de Disponibilidade



1 class AvailabilityRepository {

2 private db: Database;

3

4 // Inserir disponibilidade

5 create(availability: Availability): number {

6 const stmt = this.db.prepare(‘

7 INSERT INTO availabilities (

8 professional\_id , day\_of\_week , start\_time , end\_time , is\_active

9 ) VALUES (?, ?, ?, ?, ?)

10 ‘);

11

12 const result = stmt.run(

13 availability.professional\_id ,

14 availability.day\_of\_week ,

15 availability.start\_time ,

16 availability.end\_time ,

17 availability.is\_active !== false? 1 : 0

18 );

19 return result.lastInsertRowid as number;

20 }

21

22 // Buscar disponibilidades de um profissional

23 findByProfessional(professionalId: number): Availability \[] {

24 const stmt = this.db.prepare(

25 ‘SELECT \* FROM availabilities

26 WHERE professional\_id =?

27 ORDER BY day\_of\_week , start\_time ‘

28 );

29 return stmt.all(professionalId) as Availability \[];

30 }

31

32 // Buscar disponibilidade espec ́ıfica

33 findByDayAndTime(professionalId: number , dayOfWeek: number , time:

string): Availability | null {

34 const stmt = this.db.prepare(‘

35 SELECT \* FROM availabilities

36 WHERE professional\_id =?

37 AND day\_of\_week =?

38 AND start\_time <=?

39 AND end\_time >?

40 AND is\_active = 1

41 ‘);

42 return stmt.get(professionalId , dayOfWeek , time , time) as

Availability | null;

43 }

44 }

45

46 // Uso





47 const availabilityRepo = new AvailabilityRepository(db);

48

49 // Configurar agenda do Dr. Jo~ao (ID = 2)

50 // Turno matutino ter ̧ca-feira

51 availabilityRepo.create ({

52 professional\_id: 2,

53 day\_of\_week: 2, // Ter ̧ca

54 start\_time: ’09:00 ’,

55 end\_time: ’12:00 ’,

56 is\_active: true

57 });

58

59 // Turno vespertino ter ̧ca-feira

60 availabilityRepo.create ({

61 professional\_id: 2,

62 day\_of\_week: 2, // Ter ̧ca

63 start\_time: ’14:00 ’,

64 end\_time: ’18:00 ’,

65 is\_active: true

66 });



\#### Listing 6: Reposit ́orio de Disponibilidades



\#### Coment ́arios Importantes:



\#### • dayofweek: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab



\#### • isactive: Permite bloquear agendamentos sem deletar hist ́orico





\### 3.2 Bloco 2: Consultas (Core do Sistema)



\#### 3.2.1 Tabela: appointments



\#### Prop ́osito: Registra todas as consultas agendadas, seus status e pagamentos com pre ̧co CON-



\#### GELADO.



1 interface Appointment {

2 id?: number;

3 patient\_id: number;

4 professional\_id: number;

5 date: string; // YYYY -MM-DD

6 time: string; // HH:MM

7 duration\_minutes ?: number;

8 type: ’presencial ’ | ’online ’;

9 status ?: ’scheduled ’ | ’confirmed ’ | ’waiting ’ | ’in\_progress ’ |

10 ’completed ’ | ’no\_show ’ | ’cancelled\_by\_patient ’ |

11 ’cancelled\_by\_clinic ’ | ’rescheduled ’;

12 price: number;

13 payment\_status ?: ’pending ’ | ’processing ’ | ’paid’ | ’failed ’ |

14 ’refunded ’ | ’partially\_refunded ’;

15 video\_link ?: string;

16 room\_number ?: string;

17 notes ?: string;

18 created\_at ?: string;

19 updated\_at ?: string;

20 }



\#### Listing 7: Interface de Agendamento



1 class AppointmentRepository {

2 private db: Database;

3

4 // Agendar consulta

5 create(appointment: Appointment): number {

6 const stmt = this.db.prepare(‘

7 INSERT INTO appointments (

8 patient\_id , professional\_id , date , time , duration\_minutes ,

9 type , status , price , payment\_status , video\_link , room\_number ,

created\_at

10 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT\_TIMESTAMP)

11 ‘);

12

13 const result = stmt.run(

14 appointment.patient\_id ,

15 appointment.professional\_id ,

16 appointment.date ,

17 appointment.time ,

18 appointment.duration\_minutes || 30,

19 appointment.type ,

20 appointment.status || ’scheduled ’,

21 appointment.price ,

22 appointment.payment\_status || ’pending ’,

23 appointment.video\_link || null ,

24 appointment.room\_number || null





\##### 25 );



26 return result.lastInsertRowid as number;

27 }

28

29 // Buscar consulta por ID

30 findById(id: number): Appointment | null {

31 const stmt = this.db.prepare(‘SELECT \* FROM appointments WHERE id

= ?‘);

32 return stmt.get(id) as Appointment | null;

33 }

34

35 // Buscar consultas do paciente

36 findByPatientId(patientId: number): Appointment \[] {

37 const stmt = this.db.prepare(

38 ‘SELECT \* FROM appointments WHERE patient\_id =? ORDER BY date

DESC , time DESC ‘

39 );

40 return stmt.all(patientId) as Appointment \[];

41 }

42

43 // Buscar consultas do profissional (agenda)

44 findByProfessionalId(professionalId: number , date?: string):

Appointment \[] {

45 let query = ‘SELECT \* FROM appointments WHERE professional\_id =

?‘;

46 const params: any\[] = \[professionalId ];

47

48 if (date) {

49 query += ‘ AND date = ?‘;

50 params.push(date);

51 }

52 query += ‘ ORDER BY date , time ‘;

53

54 const stmt = this.db.prepare(query);

55 return stmt.all (... params) as Appointment \[];

56 }

57

58 // Validar RN -04 (Sem duplica ̧c~ao)

59 checkConflict(patientId: number , professionalId: number , date:

string): boolean {

60 const stmt = this.db.prepare(‘

61 SELECT COUNT (\*) as count FROM appointments

62 WHERE patient\_id =? AND professional\_id =? AND DATE(date) =?

63 AND status NOT IN (’cancelled\_by\_patient ’,

’cancelled\_by\_clinic ’, ’no\_show ’)

64 ‘);

65 const result = stmt.get(patientId , professionalId , date) as {

count: number };

66 return result.count > 0; // true = conflito

67 }

68

69 // Atualizar status

70 updateStatus(id: number , status: string): void {





71 const stmt = this.db.prepare(

72 ‘UPDATE appointments SET status = ?, updated\_at =

CURRENT\_TIMESTAMP WHERE id = ?‘

73 );

74 stmt.run(status , id);

75 }

76

77 // Atualizar status de pagamento

78 updatePaymentStatus(id: number , paymentStatus: string): void {

79 const stmt = this.db.prepare(

80 ‘UPDATE appointments SET payment\_status = ?, updated\_at =

CURRENT\_TIMESTAMP WHERE id = ?‘

81 );

82 stmt.run(paymentStatus , id);

83 }

84

85 // Cancelar consulta

86 cancel(id: number , reason: string , cancelledById: number): void {

87 const stmt = this.db.prepare(‘

88 UPDATE appointments

89 SET status = ’cancelled\_by\_patient ’, cancellation\_reason = ?,

90 cancelled\_by = ?, updated\_at = CURRENT\_TIMESTAMP

91 WHERE id =?

92 ‘);

93 stmt.run(reason , cancelledById , id);

94 }

95 }

96

97 // Uso

98 const appointmentRepo = new AppointmentRepository(db);

99

100 // Agendar consulta de cardiologia (online)

101 const appointmentId = appointmentRepo.create ({

102 patient\_id: 1, // Maria Silva

103 professional\_id: 2, // Dr. Jo~ao

104 date: ’2026 -02 -15’,

105 time: ’14:00 ’,

106 duration\_minutes: 30,

107 type: ’online ’,

108 status: ’scheduled ’,

109 price: 350.00 , // Congelado do consultation\_price

110 payment\_status: ’pending ’,

111 video\_link: ’https :// meet.zoom.com/medclinic /12345 ’

112 });

113

114 // Validar RN -04 (sem duplica ̧c~ao)

115 const hasConflict = appointmentRepo.checkConflict (1, 2, ’2026 -02 -15’);

116 if (hasConflict) {

117 console.log(’ERRO: Paciente j ́a tem consulta com este

profissional!’);

118 }

119

120 // Atualizar status para confirmada





121 appointmentRepo.updateStatus(appointmentId , ’confirmed ’);

122 appointmentRepo.updatePaymentStatus(appointmentId , ’paid’);

123

124 // Cancelar consulta

125 appointmentRepo.cancel(appointmentId , ’Paciente solicitou

cancelamento ’, 1);



\#### Listing 8: Reposit ́orio de Agendamentos



\#### Coment ́arios Importantes:



\#### • price: MUITO IMPORTANTE armazenar pre ̧co congelado. Consultas antigas mantˆem



\#### pre ̧co original.



\#### • status: Estado m ́aquina finito (9 valores poss ́ıveis). Sistema n ̃ao deve aceitar valores



\#### fora deste conjunto.



\#### • date: CHECK constraint impede agendamentos no passado.





\### 3.3 Bloco 3: Exames e Prescri ̧c ̃oes



\#### 3.3.1 Tabela: examcatalog



\#### Prop ́osito: Cat ́alogo padronizado de exames (mudan ̧ca importante em rela ̧c ̃ao ao modelo



\#### original).



```

1 interface ExamCatalogItem {

2 id?: number;

3 name: string;

4 type: ’blood ’ | ’image ’;

5 base\_price: number;

6 description ?: string;

7 }

```

\#### Listing 9: Interface do Cat ́alogo de Exames



1 class ExamCatalogRepository {

2 private db: Database;

3

4 // Inserir exame no cat ́alogo

5 create(exam: ExamCatalogItem): number {

6 const stmt = this.db.prepare(

7 ‘INSERT INTO exam\_catalog (name , type , base\_price , description)

8 VALUES (?, ?, ?, ?)‘

9 );

10 const result = stmt.run(

11 exam.name ,

12 exam.type ,

13 exam.base\_price ,

14 exam.description || null

15 );

16 return result.lastInsertRowid as number;

17 }

18

19 // Buscar todos exames

20 findAll (): ExamCatalogItem \[] {

21 const stmt = this.db.prepare(

22 ‘SELECT \* FROM exam\_catalog ORDER BY type , name ‘

23 );

24 return stmt.all() as ExamCatalogItem \[];

25 }

26

27 // Buscar por tipo

28 findByType(type: ’blood ’ | ’image ’): ExamCatalogItem \[] {

29 const stmt = this.db.prepare(

30 ‘SELECT \* FROM exam\_catalog WHERE type =? ORDER BY name ‘

31 );

32 return stmt.all(type) as ExamCatalogItem \[];

33 }

34

35 // Buscar por ID

36 findById(id: number): ExamCatalogItem | null {

37 const stmt = this.db.prepare(‘SELECT \* FROM exam\_catalog WHERE id

= ?‘);





38 return stmt.get(id) as ExamCatalogItem | null;

39 }

40 }

41

42 // Uso

43 const examCatalogRepo = new ExamCatalogRepository(db);

44

45 // Inserir exames de sangue

46 examCatalogRepo.create ({

47 name: ’Hemograma Completo ’,

48 type: ’blood ’,

49 base\_price: 80.00 ,

50 description: ’An ́alise completa de c ́elulas sangu ́ıneas’

51 });

52

53 examCatalogRepo.create ({

54 name: ’Glicemia em Jejum ’,

55 type: ’blood ’,

56 base\_price: 35.00 ,

57 description: ’Medi ̧c~ao de glicose (requer 8h jejum)’

58 });

59

60 // Inserir exames de imagem

61 examCatalogRepo.create ({

62 name: ’Raio -X T ́orax’,

63 type: ’image ’,

64 base\_price: 120.00 ,

65 description: ’Radiografia de t ́orax em PA e perfil ’

66 });



\#### Listing 10: Reposit ́orio do Cat ́alogo de Exames



\#### Coment ́arios Importantes:



\#### • name UNIQUE: Evita duplica ̧c ̃ao de exames no cat ́alogo



\#### • baseprice: Pre ̧co padr ̃ao que pode ser ajustado por cl ́ınica sem afetar hist ́orico



\#### 3.3.2 Tabela: examrequests



\#### Prop ́osito: Requisi ̧c ̃oes de exame solicitadas por profissionais (RN-09: Pedido m ́edico obri-



\#### gat ́orio).



1 interface ExamRequest {

2 id?: number;

3 appointment\_id: number;

4 patient\_id: number;

5 requesting\_professional\_id: number;

6 exam\_catalog\_id: number;

7 clinical\_indication: string;

8 price: number;

9 status ?: string;

10 payment\_status ?: string;

11 scheduled\_date ?: string;

12 result\_file\_url ?: string;





13 result\_text ?: string;

14 lab\_tech\_id ?: number;

15 created\_at ?: string;

16 updated\_at ?: string;

17 }



\#### Listing 11: Interface de Requisi ̧c ̃ao de Exame



1 class ExamRequestRepository {

2 private db: Database;

3 private examCatalogRepo: ExamCatalogRepository;

4

5 constructor(db: Database , examCatalogRepo: ExamCatalogRepository) {

6 this.db = db;

7 this.examCatalogRepo = examCatalogRepo;

8 }

9

10 // Solicitar exame (RN -09: justificativa obrigat ́oria)

11 create(examRequest: ExamRequest): number {

12 // Validar que clinical\_indication n~ao ́e vazio

13 if (! examRequest.clinical\_indication ||

14 examRequest.clinical\_indication.trim() === ’’) {

15 throw new Error(’Justificativa cl ́ınica ́e obrigat ́oria (RN -09)’);

16 }

17

18 // Buscar pre ̧co do cat ́alogo (congelar)

19 const catalogItem =

this.examCatalogRepo.findById(examRequest.exam\_catalog\_id);

20 if (! catalogItem) {

21 throw new Error(’Exame n~ao encontrado no cat ́alogo’);

22 }

23

24 const stmt = this.db.prepare(‘

25 INSERT INTO exam\_requests (

26 appointment\_id , patient\_id , requesting\_professional\_id ,

27 exam\_catalog\_id , clinical\_indication , price ,

28 status , payment\_status , created\_at

29 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT\_TIMESTAMP)

30 ‘);

31

32 const result = stmt.run(

33 examRequest.appointment\_id ,

34 examRequest.patient\_id ,

35 examRequest.requesting\_professional\_id ,

36 examRequest.exam\_catalog\_id ,

37 examRequest.clinical\_indication ,

38 catalogItem.base\_price , // Congelado

39 examRequest.status || ’pending\_payment ’,

40 examRequest.payment\_status || ’pending ’

41 );

42 return result.lastInsertRowid as number;

43 }

44

45 // Buscar exame por ID





46 findById(id: number): ExamRequest | null {

47 const stmt = this.db.prepare(‘SELECT \* FROM exam\_requests WHERE

id = ?‘);

48 return stmt.get(id) as ExamRequest | null;

49 }

50

51 // Buscar exames do paciente

52 findByPatientId(patientId: number): ExamRequest \[] {

53 const stmt = this.db.prepare(

54 ‘SELECT \* FROM exam\_requests WHERE patient\_id =? ORDER BY

created\_at DESC ‘

55 );

56 return stmt.all(patientId) as ExamRequest \[];

57 }

58

59 // Atualizar status

60 updateStatus(id: number , status: string): void {

61 const stmt = this.db.prepare(

62 ‘UPDATE exam\_requests SET status = ?, updated\_at =

CURRENT\_TIMESTAMP WHERE id = ?‘

63 );

64 stmt.run(status , id);

65 }

66

67 // Lan ̧car resultado (lab\_tech)

68 uploadResult(id: number , resultText: string , resultFileUrl ?: string ,

69 labTechId ?: number): void {

70 const stmt = this.db.prepare(‘

71 UPDATE exam\_requests

72 SET result\_text = ?, result\_file\_url = ?, lab\_tech\_id = ?,

73 status = ’ready ’, updated\_at = CURRENT\_TIMESTAMP

74 WHERE id =?

75 ‘);

76

77 stmt.run(resultText , resultFileUrl || null , labTechId || null ,

id);

78 }

79

80 // RN -13: Validar acesso ao resultado

81 canViewResult(examId: number , userId: number , userRole: string):

boolean {

82 const exam = this.findById(examId);

83 if (!exam) return false;

84

85 // Paciente pode ver seus pr ́oprios resultados

86 if (userRole === ’patient ’ \&\& exam.patient\_id === userId) return

true;

87 // M ́edico que solicitou pode ver

88 if (userRole === ’health\_professional ’ \&\&

89 exam.requesting\_professional\_id === userId) return true;

90 // Admin pode ver tudo

91 if (userRole === ’clinic\_admin ’ || userRole === ’system\_admin ’)

return true;





92

93 return false;

94 }

95 }

96

97 // Uso

98 const examRequestRepo = new ExamRequestRepository(db,

examCatalogRepo);

99

100 // Solicitar exame ap ́os consulta

101 const examRequestId = examRequestRepo.create ({

102 appointment\_id: 1,

103 patient\_id: 1, // Maria Silva

104 requesting\_professional\_id: 2, // Dr. Jo~ao

105 exam\_catalog\_id: 1, // Hemograma Completo

106 clinical\_indication: ’Paciente relata fadiga e fraqueza. Necess ́ario

avaliar s ́erie vermelha ’,

107 price: 80.

108 });

109

110 // Lab tech lan ̧ca resultado

111 examRequestRepo.uploadResult(

112 examRequestId ,

113 ’Hemoglobina: 13.5 g/dL (Normal)\\nGl ́obulos vermelhos: 4.

milh~oes/μL (Normal)’,

114 ’https :// storage/results/exam\_1\_2026 -01 -24. pdf’,

115 4 // lab\_tech\_id

116 );

117

118 // Validar RN -13 (controle de acesso)

119 const canView = examRequestRepo.canViewResult(examRequestId , 1,

’patient ’);

120 if (canView) {

121 console.log(’Paciente pode visualizar resultado ’);

122 }



\#### Listing 12: Reposit ́orio de Requisi ̧c ̃oes de Exame



\#### Coment ́arios Importantes:



\#### • clinicalindication: NAO pode ser nulo. RN-09 exige justificativa. ̃



\#### • price: Congelado do cat ́alogo. Pedidos antigos mantˆem pre ̧co original.



\#### • RN-13: Acesso restrito. Implementar no backend antes de retornar dados.



\#### 3.3.3 Tabela: prescriptions



\#### Prop ́osito: Armazena prescri ̧c ̃oes digitais emitidas durante consultas.



```

1 interface Prescription {

2 id?: number;

3 appointment\_id: number;

4 patient\_id: number;

5 professional\_id: number;

```



6 medication\_name: string;

7 dosage ?: string;

8 instructions ?: string;

9 is\_controlled ?: boolean;

10 pdf\_url ?: string;

11 created\_at ?: string;

12 }



\#### Listing 13: Interface de Prescri ̧c ̃ao



1 class PrescriptionRepository {

2 private db: Database;

3

4 // Criar prescri ̧c~ao

5 create(prescription: Prescription): number {

6 const stmt = this.db.prepare(‘

7 INSERT INTO prescriptions (

8 appointment\_id , patient\_id , professional\_id , medication\_name ,

9 dosage , instructions , is\_controlled , pdf\_url , created\_at

10 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT\_TIMESTAMP)

11 ‘);

12

13 const result = stmt.run(

14 prescription.appointment\_id ,

15 prescription.patient\_id ,

16 prescription.professional\_id ,

17 prescription.medication\_name ,

18 prescription.dosage || null ,

19 prescription.instructions || null ,

20 prescription.is\_controlled? 1 : 0,

21 prescription.pdf\_url || null

22 );

23 return result.lastInsertRowid as number;

24 }

25

26 // Buscar prescri ̧c~oes do paciente

27 findByPatientId(patientId: number): Prescription \[] {

28 const stmt = this.db.prepare(

29 ‘SELECT \* FROM prescriptions WHERE patient\_id =? ORDER BY

created\_at DESC ‘

30 );

31 return stmt.all(patientId) as Prescription \[];

32 }

33

34 // Buscar prescri ̧c~oes de uma consulta

35 findByAppointmentId(appointmentId: number): Prescription \[] {

36 const stmt = this.db.prepare(

37 ‘SELECT \* FROM prescriptions WHERE appointment\_id =? ORDER BY

created\_at DESC ‘

38 );

39 return stmt.all(appointmentId) as Prescription \[];

40 }

41 }

42





43 // Uso

44 const prescriptionRepo = new PrescriptionRepository(db);

45

46 // Prescrever medicamento ap ́os consulta

47 prescriptionRepo.create ({

48 appointment\_id: 1,

49 patient\_id: 1, // Maria Silva

50 professional\_id: 2, // Dr. Jo~ao

51 medication\_name: ’Amoxicilina 500mg’,

52 dosage: ’1 comprimido ’,

53 instructions: ’A cada 8 horas durante 7 dias. Tomar com ́agua’,

54 is\_controlled: false ,

55 pdf\_url: ’https :// storage/prescriptions /123456. pdf’

56 });

57

58 // Prescrever medicamento controlado

59 prescriptionRepo.create ({

60 appointment\_id: 1,

61 patient\_id: 1,

62 professional\_id: 2,

63 medication\_name: ’Alprazolam 0.5mg’,

64 dosage: ’1 comprimido ’,

65 instructions: ’Uma vez ao dia , antes de dormir. Usar por m ́aximo 15

dias’,

66 is\_controlled: true , // Requer assinatura digital

67 pdf\_url: ’https :// storage/prescriptions /123457. pdf’

68 });



\#### Listing 14: Reposit ́orio de Prescri ̧c ̃oes





\### 3.4 Bloco 4: Financeiro (Pagamentos e Comissionamento)



\#### 3.4.1 Tabela: transactions



\#### Prop ́osito: Registra TODA transa ̧c ̃ao financeira com valores brutos, MDR e l ́ıquidos.



1 interface Transaction {

2 id?: number;

3 type: ’appointment\_payment ’ | ’exam\_payment ’ | ’refund ’;

4 reference\_id: number;

5 reference\_type: ’appointment ’ | ’exam’;

6 payer\_id: number;

7 amount\_gross: number;

8 mdr\_fee: number;

9 amount\_net: number;

10 installments ?: number;

11 payment\_method ?: string;

12 gateway\_transaction\_id ?: string;

13 card\_brand ?: string;

14 card\_last4 ?: string;

15 status ?: string;

16 processed\_at ?: string;

17 created\_at ?: string;

18 updated\_at ?: string;

19 }



\#### Listing 15: Interface de Transa ̧c ̃ao



1 class TransactionRepository {

2 private db: Database;

3

4 // Criar transa ̧c~ao

5 create(transaction: Transaction): number {

6 // Validar MDR (3.79%)

7 const expectedMdr = Math.round(transaction.amount\_gross \* 0.0379

\* 100) / 100;

8 if (Math.abs(transaction.mdr\_fee - expectedMdr) > 0.01) {

9 throw new Error(

10 ‘MDR inv ́alido. Esperado:${expectedMdr}, Recebido:

${transaction.mdr\_fee}‘

11 );

12 }

13

14 // Validar amount\_net = amount\_gross - mdr\_fee

15 const expectedNet = transaction.amount\_gross -

transaction.mdr\_fee;

16 if (Math.abs(transaction.amount\_net - expectedNet) > 0.01) {

17 throw new Error(

18 ‘Valor l ́ıquido inv ́alido. Esperado:${expectedNet}, Recebido:

${transaction.amount\_net}‘

19 );

20 }

21

22 const stmt = this.db.prepare(‘

23 INSERT INTO transactions (





24 type , reference\_id , reference\_type , payer\_id , amount\_gross ,

25 mdr\_fee , amount\_net , installments , payment\_method ,

26 gateway\_transaction\_id , card\_brand , card\_last4 ,

27 status , processed\_at , created\_at

28 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,

CURRENT\_TIMESTAMP)

29 ‘);

30

31 const result = stmt.run(

32 transaction.type ,

33 transaction.reference\_id ,

34 transaction.reference\_type ,

35 transaction.payer\_id ,

36 transaction.amount\_gross ,

37 transaction.mdr\_fee ,

38 transaction.amount\_net ,

39 transaction.installments || 1,

40 transaction.payment\_method || ’credit\_card ’,

41 transaction.gateway\_transaction\_id || null ,

42 transaction.card\_brand || null ,

43 transaction.card\_last4 || null ,

44 transaction.status || ’processing ’,

45 transaction.processed\_at || null

46 );

47 return result.lastInsertRowid as number;

48 }

49

50 // Buscar transa ̧c~ao por ID

51 findById(id: number): Transaction | null {

52 const stmt = this.db.prepare(‘SELECT \* FROM transactions WHERE id

= ?‘);

53 return stmt.get(id) as Transaction | null;

54 }

55

56 // Buscar transa ̧c~oes do pagador

57 findByPayerId(payerId: number): Transaction \[] {

58 const stmt = this.db.prepare(

59 ‘SELECT \* FROM transactions WHERE payer\_id =? ORDER BY

created\_at DESC ‘

60 );

61 return stmt.all(payerId) as Transaction \[];

62 }

63

64 // Atualizar status

65 updateStatus(id: number , status: string , processedAt ?: string):

void {

66 const stmt = this.db.prepare(

67 ‘UPDATE transactions SET status = ?, processed\_at = ?,

68 updated\_at = CURRENT\_TIMESTAMP WHERE id = ?‘

69 );

70 stmt.run(status , processedAt || new Date().toISOString (), id);

71 }

72 }





73

74 // Uso

75 const transactionRepo = new TransactionRepository(db);

76

77 // Processar pagamento de consulta

78 const transactionId = transactionRepo.create ({

79 type: ’appointment\_payment ’,

80 reference\_id: 1, // ID do appointment

81 reference\_type: ’appointment ’,

82 payer\_id: 1, // Patient ID (Maria Silva)

83 amount\_gross: 350.00 ,

84 mdr\_fee: 13.27 , // 3.79% de MDR

85 amount\_net: 336.73 , // 350.00 - 13.27

86 installments: 3, // 3x sem juros

87 payment\_method: ’credit\_card ’,

88 gateway\_transaction\_id: ’MOCK -’ + Date.now(),

89 card\_brand: ’visa’,

90 card\_last4: ’1234’, // Apenas ́ultimos 4 d ́ıgitos!

91 status: ’paid’,

92 processed\_at: new Date().toISOString ()

93 });



\#### Listing 16: Reposit ́orio de Transa ̧c ̃oes



\#### Coment ́arios Importantes:



\#### • cardlast4: NUNCA armazenar n ́umero completo. RN-17: apenas ́ultimos 4 d ́ıgitos.



\#### • mdrfee: SEMPRE 3.79% (CloudWalk). Validar com verifica ̧c ̃ao.



\#### • amountnet: Deve ser amountgross - mdrfee.



\#### 3.4.2 Tabela: commissionsplits



\#### Prop ́osito: Rastreia divis ̃ao de cada transa ̧c ̃ao: profissional (60%), cl ́ınica (35%), sistema



\#### (5%).



1 interface CommissionSplit {

2 id?: number;

3 transaction\_id: number;

4 recipient\_id ?: number;

5 recipient\_type: ’professional ’ | ’clinic ’ | ’system ’;

6 percentage: number;

7 amount: number;

8 status ?: string;

9 created\_at ?: string;

10 }



\#### Listing 17: Interface de Divis ̃ao de Comiss ̃ao



```

1 class CommissionSplitRepository {

2 private db: Database;

3

4 // Criar splits para uma transa ̧c~ao

5 createSplits(transactionId: number , amountNet: number): void {

6 // 60% para profissional

```



7 this.create ({

8 transaction\_id: transactionId ,

9 recipient\_type: ’professional ’,

10 percentage: 60.00 ,

11 amount: Math.round(amountNet \* 0.60 \* 100) / 100,

12 status: ’pending ’

13 });

14

15 // 35% para cl ́ınica

16 this.create ({

17 transaction\_id: transactionId ,

18 recipient\_type: ’clinic ’,

19 percentage: 35.00 ,

20 amount: Math.round(amountNet \* 0.35 \* 100) / 100,

21 status: ’pending ’

22 });

23

24 // 5% para sistema

25 this.create ({

26 transaction\_id: transactionId ,

27 recipient\_type: ’system ’,

28 percentage: 5.00,

29 amount: Math.round(amountNet \* 0.05 \* 100) / 100,

30 status: ’pending ’

31 });

32 }

33

34 // Inserir split individual

35 private create(split: CommissionSplit): number {

36 const stmt = this.db.prepare(‘

37 INSERT INTO commission\_splits (

38 transaction\_id , recipient\_id , recipient\_type ,

39 percentage , amount , status , created\_at

40 ) VALUES (?, ?, ?, ?, ?, ?, CURRENT\_TIMESTAMP)

41 ‘);

42

43 const result = stmt.run(

44 split.transaction\_id ,

45 split.recipient\_id || null ,

46 split.recipient\_type ,

47 split.percentage ,

48 split.amount ,

49 split.status || ’pending ’

50 );

51 return result.lastInsertRowid as number;

52 }

53

54 // Buscar comiss~oes pendentes do profissional

55 findPendingByProfessional(professionalId: number):

CommissionSplit \[] {

56 const stmt = this.db.prepare(‘

57 SELECT \* FROM commission\_splits

58 WHERE recipient\_id =? AND recipient\_type = ’professional ’





59 AND status = ’pending ’

60 ORDER BY created\_at DESC

61 ‘);

62 return stmt.all(professionalId) as CommissionSplit \[];

63 }

64

65 // Relat ́orio mensal de comiss~ao (RN -28)

66 getMonthlyCommission(professionalId: number , month: number , year:

number): {

67 totalAppointments: number;

68 totalCommission: number;

69 splits: CommissionSplit \[];

70 } {

71 const startDate = ‘${year}-${String(month).padStart(2, ’0’)}-01‘;

72 const endDate = new Date(year , month ,

0).toISOString ().split(’T’)\[0];

73

74 const commissionsStmt = this.db.prepare(‘

75 SELECT cs.\* FROM commission\_splits cs

76 INNER JOIN transactions t ON cs.transaction\_id = t.id

77 WHERE cs.recipient\_id =?

78 AND cs.recipient\_type = ’professional ’

79 AND DATE(t.created\_at) BETWEEN? AND?

80 AND t.status = ’paid’

81 ‘);

82

83 const splits = commissionsStmt.all(

84 professionalId , startDate , endDate

85 ) as CommissionSplit \[];

86 const totalCommission = splits.reduce ((sum , split) => sum +

split.amount , 0);

87 const totalAppointments = new Set(splits.map(s =>

s.transaction\_id)).size;

88

89 return {

90 totalAppointments ,

91 totalCommission ,

92 splits

93 };

94 }

95 }

96

97 // Uso

98 const commissionSplitRepo = new CommissionSplitRepository(db);

99

100 // Ap ́os processar pagamento

101 commissionSplitRepo.createSplits (1, 336.73);

102 // Resultado:

103 // |- Profissional (60%): R$ 202.04

104 // |- Clinica (35%): R$ 117.86

105 // L- Sistema (5%): R$ 16.83

106

107 // Buscar comiss~oes pendentes do Dr. Jo~ao





108 const pendingCommissions =

commissionSplitRepo.findPendingByProfessional (2);

109 console.log(

110 ‘Comiss~oes pendentes: R$${

111 pendingCommissions.reduce ((sum , c) => sum + c.amount ,

0).toFixed (2)

112 }‘

113 );

114

115 // Relat ́orio mensal (janeiro 2026, Dr. Jo~ao ID = 2)

116 const monthlyReport = commissionSplitRepo.getMonthlyCommission (2, 1,

2026);

117 console.log(‘Total consultas:${monthlyReport.totalAppointments }‘);

118 console.log(‘Total comiss~ao: R$

${monthlyReport.totalCommission.toFixed (2)}‘);



\#### Listing 18: Reposit ́orio de Divis ̃ao de Comiss ̃oes



\#### 3.4.3 Tabela: refunds



\#### Prop ́osito: Registra reembolsos (RN-21:



\#### ¿24h = 100%, RN-22:



\#### ¡24h = 70%).



```

1 class RefundRepository {

2 private db: Database;

3

4 // Calcular reembolso (RN -21 ou RN -22)

5 calculateRefundAmount(amountNet: number ,

6 hoursBeforeAppointment: number): number {

7 if (hoursBeforeAppointment > 24) {

8 // RN -21: >24h = 100% reembolso

9 return amountNet;

10 } else {

11 // RN -22: <24h = 70% reembolso

12 return Math.round(amountNet \* 0.70 \* 100) / 100;

13 }

14 }

15

16 // Processar reembolso

17 create(refund: {

18 transaction\_id: number;

19 amount\_refunded: number;

20 reason: string;

21 requested\_by: number;

22 }): number {

23 const stmt = this.db.prepare(‘

24 INSERT INTO refunds (

25 transaction\_id , amount\_refunded , reason , requested\_by ,

created\_at

26 ) VALUES (?, ?, ?, ?, CURRENT\_TIMESTAMP)

27 ‘);

28

29 const result = stmt.run(

```



30 refund.transaction\_id ,

31 refund.amount\_refunded ,

32 refund.reason ,

33 refund.requested\_by

34 );

35 return result.lastInsertRowid as number;

36 }

37 }

38

39 // Uso

40 const refundRepo = new RefundRepository(db);

41

42 // Cen ́ario 1: Cancelamento >24h (100% reembolso)

43 const refundAmount100 = refundRepo.calculateRefundAmount (336.73 , 25);

44 // Resultado: 336.73 (100%)

45

46 // Cen ́ario 2: Cancelamento <24h (70% reembolso)

47 const refundAmount70 = refundRepo.calculateRefundAmount (336.73 , 12);

48 // Resultado: 235.71 (70%)

49

50 // Processar reembolso

51 refundRepo.create ({

52 transaction\_id: 1,

53 amount\_refunded: refundAmount70 ,

54 reason: ’cancelled\_by\_patient\_less\_24h ’,

55 requested\_by: 1 // Patient ID

56 });



\#### Listing 19: Reposit ́orio de Reembolsos



\#### 3.4.4 Tabela: monthlyreports



\#### Prop ́osito: Relat ́orios mensais de comiss ̃ao (RN-28: Repasse at ́e dia 10 do mˆes).



1 class MonthlyReportRepository {

2 private db: Database;

3 private commissionSplitRepo: CommissionSplitRepository;

4

5 constructor(db: Database , commissionSplitRepo:

CommissionSplitRepository) {

6 this.db = db;

7 this.commissionSplitRepo = commissionSplitRepo;

8 }

9

10 // Gerar relat ́orio mensal (cron job do dia 1◦)

11 generateMonthlyReport(professionalId: number , month: number , year:

number): number {

12 const prevMonth = month === 1? 12 : month - 1;

13 const prevYear = month === 1? year - 1 : year;

14

15 const startDate = ‘${prevYear}-${String(prevMonth).padStart(2,

’0’)}-01‘;

16 const endDate = new Date(prevYear , prevMonth , 0)

17 .toISOString ().split(’T’)\[0];





18

19 const stmt = this.db.prepare(‘

20 SELECT

21 COUNT(DISTINCT a.id) as total\_appointments ,

22 SUM(t.amount\_gross) as total\_gross\_amount ,

23 SUM(t.amount\_net) as total\_net\_amount ,

24 SUM(cs.amount) as total\_commission

25 FROM commission\_splits cs

26 INNER JOIN transactions t ON cs.transaction\_id = t.id

27 INNER JOIN appointments a ON t.reference\_id = a.id

28 AND t.reference\_type = ’appointment ’

29 WHERE cs.recipient\_id =?

30 AND cs.recipient\_type = ’professional ’

31 AND a.status = ’completed ’

32 AND DATE(t.created\_at) BETWEEN? AND?

33 AND t.status = ’paid’

34 ‘);

35

36 const result = stmt.get(professionalId , startDate , endDate) as {

37 total\_appointments: number;

38 total\_gross\_amount: number;

39 total\_net\_amount: number;

40 total\_commission: number;

41 };

42

43 const amountToReceive = (result.total\_commission || 0) > 0

44? result.total\_commission

45 : 0;

46

47 const reportStmt = this.db.prepare(‘

48 INSERT INTO monthly\_reports (

49 professional\_id , month , year , total\_appointments ,

total\_gross\_amount ,

50 total\_net\_amount , total\_commission , total\_deductions ,

amount\_to\_receive ,

51 payment\_status , generated\_at

52 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT\_TIMESTAMP)

53 ‘);

54

55 const reportResult = reportStmt.run(

56 professionalId ,

57 month ,

58 year ,

59 result.total\_appointments || 0,

60 result.total\_gross\_amount || 0,

61 result.total\_net\_amount || 0,

62 result.total\_commission || 0,

63 0, // Sem dedu ̧c~oes por enquanto

64 amountToReceive ,

65 ’generated ’

66 );

67 return reportResult.lastInsertRowid as number;

68 }





69

70 // Marcar relat ́orio como pago

71 markAsPaid(reportId: number): void {

72 const stmt = this.db.prepare(

73 ‘UPDATE monthly\_reports SET payment\_status = ’paid’,

74 payment\_date = CURRENT\_TIMESTAMP WHERE id = ?‘

75 );

76 stmt.run(reportId);

77 }

78 }

79

80 // Uso (cron job executado todo dia 1◦ `as 00:00)

81 const monthlyReportRepo = new MonthlyReportRepository(

82 db,

83 commissionSplitRepo

84 );

85

86 // Gerar relat ́orios para todos os profissionais

87 const allProfessionals = userRepo.findByRole(’health\_professional ’);

88

89 allProfessionals.forEach(prof => {

90 const reportId = monthlyReportRepo.generateMonthlyReport(prof.id,

2, 2026);

91 console.log(‘Relat ́orio${reportId} gerado para profissional

${prof.id}‘);

92 });



\#### Listing 20: Reposit ́orio de Relat ́orios Mensais





\## 4 Setup de TypeScript com SQLite



\### 4.1 Configura ̧c ̃ao Recomendada



1 import Database from ’better -sqlite3 ’;

2 import path from ’path’;

3

4 export class MedClinicDatabase {

5 private db: Database.Database;

6

7 constructor () {

8 const dbPath = path.join(process.cwd(), ’database ’,

’medclinic.db’);

9 this.db = new Database(dbPath);

10

11 // Habilitar foreign keys

12 this.db.pragma(’foreign\_keys = ON’);

13 // Modo journal mais seguro

14 this.db.pragma(’journal\_mode = WAL’);

15 }

16

17 initialize (): void {

18 const schema = require(’fs’).readFileSync(

19 path.join(process.cwd(), ’src’, ’database ’, ’schema.sql’),

20 ’utf -8’

21 );

22

23 this.db.exec(schema);

24 console.log(’ Banco de dados inicializado ’);

25 }

26

27 getConnection (): Database.Database {

28 return this.db;

29 }

30

31 close (): void {

32 this.db.close ();

33 }

34 }

35

36 export const database = new MedClinicDatabase ();



\#### Listing 21: Inicializa ̧c ̃ao do Banco de Dados



\### 4.2 Package.json Recomendado



\#### Listing 22: Dependˆencias do Projeto



\##### {



```

"dependencies": {

"express": "^4.18.0" ,

"better -sqlite3": "^9.0.0" ,

"bcrypt": "^5.1.0" ,

```



"jsonwebtoken": "^9.0.0" ,

"dotenv": "^16.0.0"

},

"devDependencies": {

"typescript": "^5.0.0" ,

"@types/node": "^20.0.0" ,

"@types/express": "^4.17.0" ,

"@types/better -sqlite3": "^7.6.0" ,

"@types/bcrypt": "^5.0.0"

}

}





\## 5 Conclus ̃ao



\#### Este modelo de banco de dados foi projetado para atender aos mais altos padr ̃oes de qualidade



\#### profissional:



\#### • ✓Respeita TODAS as 28 regras de neg ́ocio especificadas



\#### • ✓Implementa separa ̧c ̃ao clara de responsabilidades entre entidades



\#### • ✓Facilita auditoria completa de transa ̧c ̃oes, comiss ̃oes e cancelamentos



\#### • ✓Previne inconsistˆencias com constraints e valida ̧c ̃oes robustas



\#### • ✓Otimiza queries com ́ındices estrat ́egicos



\#### • ✓Mant ́em hist ́orico de pre ̧cos que n ̃ao se altera com atualiza ̧c ̃oes futuras



\#### • ✓Implementa seguran ̧ca nunca armazenando dados sens ́ıveis completos



\#### • ✓Tipagem forte em TypeScript para desenvolvimento seguro



\#### O backend deve complementar este modelo implementando valida ̧c ̃oes adicionais em ca-



\#### mada aplica ̧c ̃ao (regras de neg ́ocio complexas), enquanto o banco de dados garante integridade



\#### estrutural de todos os dados.



\#### Vers ̃ao: 1.0 Data: Janeiro 2026







