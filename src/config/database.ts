import sqlite3 from 'sqlite3';
import path from 'node:path';
import fs from 'node:fs';

/**
 * MedClinic Database - Singleton Pattern
 * Gerencia conexao unica com o banco de dados SQLite
 */
export class MedClinicDatabase {
    private static instance: MedClinicDatabase;
    private db: sqlite3.Database | null = null;
    private readonly dbPath: string;

    private constructor() {
        const dbDir = path.join(process.cwd(), 'database');

        // Criar diretorio se nao existir
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        this.dbPath = path.join(dbDir, 'medclinic.db');
    }

    /**
     * Retorna a instancia unica do banco de dados (Singleton)
     */
    public static getInstance(): MedClinicDatabase {
        if (!MedClinicDatabase.instance) {
            MedClinicDatabase.instance = new MedClinicDatabase();
        }
        return MedClinicDatabase.instance;
    }

    /**
     * Conecta ao banco de dados
     */
    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err: Error | null) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Habilitar foreign keys
                this.db!.run('PRAGMA foreign_keys = ON', (err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Modo journal mais seguro
                    this.db!.run('PRAGMA journal_mode = WAL', (err: Error | null) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        console.log('Database connected successfully');
                        resolve();
                    });
                });
            });
        });
    }

    /**
     * Inicializa o banco de dados executando o schema SQL
     */
    public async initialize(): Promise<void> {
        if (!this.db) {
            await this.connect();
        }

        const schemaPath = path.join(process.cwd(), 'src', 'database', 'schema.sql');

        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found: ${schemaPath}`);
        }

        const schema = fs.readFileSync(schemaPath, 'utf-8');

        return new Promise((resolve, reject) => {
            this.db!.exec(schema, (err: Error | null) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('Database initialized successfully');
                resolve();
            });
        });
    }

    /**
     * Retorna a conexao do banco de dados
     */
    public getConnection(): sqlite3.Database {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }

    /**
     * Fecha a conexao com o banco de dados
     */
    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    this.db = null;
                    console.log('Database connection closed');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Verifica se o banco de dados esta conectado
     */
    public isConnected(): boolean {
        return this.db !== null;
    }

    /**
     * Executa uma query SQL (SELECT)
     */
    public query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not connected'));
                return;
            }

            this.db.all(sql, params, (err: Error | null, rows: unknown[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows as T[]);
            });
        });
    }

    /**
     * Executa uma query SQL que retorna uma unica linha
     */
    public queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not connected'));
                return;
            }

            this.db.get(sql, params, (err: Error | null, row: unknown) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve((row as T) || null);
            });
        });
    }

    /**
     * Executa uma query SQL (INSERT, UPDATE, DELETE)
     */
    public run(sql: string, params: unknown[] = []): Promise<{ lastID: number; changes: number }> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not connected'));
                return;
            }

            this.db.run(sql, params, function (this: sqlite3.RunResult, err: Error | null) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({
                    lastID: this.lastID,
                    changes: this.changes
                });
            });
        });
    }

    /**
     * Retorna o caminho do arquivo do banco de dados
     */
    public getDatabasePath(): string {
        return this.dbPath;
    }
}

// Exporta instancia singleton para uso direto
export const database = MedClinicDatabase.getInstance();
