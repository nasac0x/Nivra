# Nivra na Nuvem (Supabase) — Guia de Bolso

Este guia resolve o maior risco do Nivra: **dados presos no navegador**.
Com a nuvem ativa, seus dados moram num banco Postgres grátis — limpar
cache/cookies do navegador não apaga mais nada — e você loga no PC e no
celular com a mesma conta.

## O que é cada coisa (30 segundos)

- **Supabase**: serviço gratuito que dá banco de dados + sistema de login.
  Plano free: 500MB de banco (seus dados usariam ~1MB em anos), pausa após
  7 dias sem uso (basta clicar "Restore" — sem perda de dados).
- **Anon key / URL**: são o "endereço" do seu banco. PODEM ficar no front —
  não são senha. Quem protege os dados é o **RLS**: regras dentro do banco
  que só deixam cada conta enxergar as linhas dela.
- **Sua senha**: nunca passa pelo código do site. Fica guardada (em hash)
  no Supabase Auth.

## Passo a passo (uns 15 minutos)

1. **Criar conta**: acesse [supabase.com](https://supabase.com) → Start your
   project → crie conta grátis (pode ser com GitHub/Google).
2. **Criar projeto**: New project → nome `nivra` → escolha a região mais
   perto (ex: South America, São Paulo) → defina uma senha de banco
   (anote, mas você não vai usá-la no dia a dia) → aguarde provisionar.
3. **Rodar o schema**: no painel do projeto, abra **SQL Editor** → cole TODO
   o conteúdo do arquivo `supabase/schema.sql` deste projeto → Run.
   Isso cria as tabelas + as regras de segurança (RLS).
4. **Pegar as credenciais**: **Project Settings → API** → copie:
   - `Project URL` → vai em `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → vai em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Ligar no Nivra**: copie `.env.example` para `.env.local` (na raiz do
   projeto) e cole os dois valores. Reinicie o `bun run dev`.
6. **Criar sua conta**: no Nivra, apareceu um botão de Nuvem no topo.
   Cadastre seu e-mail + uma senha → seus dados atuais sobem pra nuvem
   automaticamente no primeiro login.
7. **No celular**: abra o Nivra (hospede na Vercel, ou roda local na mesma
   rede), logue com o mesmo e-mail → mesmos dados, tela pequena.

## Como o app decide onde salvar

| Situação | Onde os dados ficam |
|---|---|
| Sem `.env.local` preenchido | Só localStorage (igual a antes) |
| Logado na nuvem | localStorage (resposta instantânea) **+** nuvem (backup + sync) |
| Nuvem fora do ar | App continua no local; sincroniza quando volta |

## Backup continua valendo

Mesmo com nuvem ativa, o botão de exportar JSON no **Settings → Backup**
continua sendo seu snapshot manual — nuvem é infraestrutura, backup é
backup. Exporte de vez em quando e guarde o arquivo em lugar seguro.
