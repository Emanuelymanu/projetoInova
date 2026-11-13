/** Até este nível (%) a lixeira é considerada vazia. */
export const LIMITE_VAZIA_PCT = 10;
/** A partir deste nível (%) a lixeira é considerada cheia e precisa de coleta. */
export const LIMITE_CHEIA_PCT = 80;
/** Abaixo deste nível (%) a bateria do sensor é sinalizada no dashboard. */
export const LIMITE_BATERIA_BAIXA_PCT = 20;
/** Sem leitura há mais que isso, o nível exibido já não é confiável. */
export const MINUTOS_SEM_SINAL = 60;

export const JWT_EXPIRA_EM = '8h';
export const BCRYPT_CUSTO = 10;
export const MAX_PONTOS_HISTORICO = 500;

/** Estimativa de tempo da rota: velocidade média do caminhão e tempo parado em cada ponto. */
export const VELOCIDADE_MEDIA_KMH = 20;
export const MINUTOS_POR_PARADA = 4;

/**
 * Esvaziamento detectado pelo sensor: o nível cai pelo menos QUEDA_MINIMA pontos e
 * termina em até NIVEL_MAXIMO_APOS. Ex.: de 85% para 6% conta; de 50% para 35% não.
 */
export const QUEDA_MINIMA_ESVAZIAMENTO_PCT = 30;
export const NIVEL_MAXIMO_APOS_ESVAZIAMENTO_PCT = 20;
/**
 * Depois de marcada a coleta, quanto tempo o sensor tem para mostrar a queda de nível.
 * Precisa cobrir o intervalo entre leituras do sensor (15 a 30 min) com folga.
 */
export const JANELA_CONFIRMACAO_SENSOR_MIN = 90;
