import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // ============================================
  // CORS / PREFLIGHT
  // ============================================
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    // ============================================
    // MÉTODO HTTP
    // ============================================
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Método no permitido",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // ============================================
    // VARIABLES DE SUPABASE
    // ============================================
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Faltan variables de entorno de Supabase",
      );

      return new Response(
        JSON.stringify({
          error: "Configuración de Supabase incompleta",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // ============================================
    // TOKEN DEL USUARIO
    // ============================================
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Falta el token de autenticación",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // ============================================
    // CLIENTE ADMINISTRADOR
    // ============================================
    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // ============================================
    // VALIDAR USUARIO AUTENTICADO
    // ============================================
    const token = authHeader.replace(
      "Bearer ",
      "",
    );

    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(token);

    if (userError || !user) {
      console.error(
        "Error verificando usuario:",
        userError,
      );

      return new Response(
        JSON.stringify({
          error: "Sesión no válida",
          details: userError?.message ?? null,
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    console.log(
      "Usuario autenticado:",
      user.id,
    );

    // ============================================
    // LEER BODY
    // ============================================
    const body = await req.json();

    const staff_id = body?.staff_id;
    const email = body?.email;

    if (!staff_id || !email) {
      return new Response(
        JSON.stringify({
          error:
            "staff_id y email son obligatorios",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    console.log(
      "Solicitud para staff:",
      staff_id,
    );

    console.log(
      "Correo recibido:",
      email,
    );

    // ============================================
    // BUSCAR MEMBERSHIP DEL ADMINISTRADOR
    // ============================================
    const {
      data: adminMembership,
      error: membershipError,
    } = await adminClient
      .from("school_memberships")
      .select(
        `
        id,
        school_id,
        person_id,
        role,
        is_active
        `,
      )
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (membershipError) {
      console.error(
        "Error buscando membership:",
        membershipError,
      );

      return new Response(
        JSON.stringify({
          error:
            "No se pudo verificar la membership del administrador",
          details:
            membershipError.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!adminMembership) {
      return new Response(
        JSON.stringify({
          error:
            "El usuario no tiene una membership activa",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    console.log(
      "Administrador autorizado en colegio:",
      adminMembership.school_id,
    );

    // ============================================
    // BUSCAR TRABAJADOR
    // ============================================
    const {
      data: staff,
      error: staffError,
    } = await adminClient
      .from("staff")
      .select(
        `
        id,
        school_id,
        person_id,
        staff_code,
        situation,
        is_teacher
        `,
      )
      .eq("id", staff_id)
      .eq(
        "school_id",
        adminMembership.school_id,
      )
      .maybeSingle();

    if (staffError) {
      console.error(
        "Error buscando staff:",
        staffError,
      );

      return new Response(
        JSON.stringify({
          error:
            "No se pudo consultar el trabajador",
          details:
            staffError.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!staff) {
      return new Response(
        JSON.stringify({
          error:
            "El trabajador no pertenece al colegio",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    console.log(
      "Trabajador encontrado:",
      staff.staff_code,
    );

    // ============================================
    // VERIFICAR SI YA TIENE CUENTA
    // ============================================
    const {
      data: existingMembership,
      error: existingMembershipError,
    } = await adminClient
      .from("school_memberships")
      .select(
        `
        id,
        user_id,
        person_id,
        is_active
        `,
      )
      .eq(
        "school_id",
        staff.school_id,
      )
      .eq(
        "person_id",
        staff.person_id,
      )
      .maybeSingle();

    if (existingMembershipError) {
      console.error(
        "Error comprobando cuenta existente:",
        existingMembershipError,
      );

      return new Response(
        JSON.stringify({
          error:
            "No se pudo verificar si el trabajador ya tiene cuenta",
          details:
            existingMembershipError.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (existingMembership) {
      return new Response(
        JSON.stringify({
          error:
            "El trabajador ya tiene una cuenta",
          membership_id:
            existingMembership.id,
          user_id:
            existingMembership.user_id,
        }),
        {
          status: 409,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // ============================================
    // VALIDACIÓN CORRECTA
    // ============================================
    console.log(
      "Validación correcta. No se creará cuenta.",
    );

    return new Response(
      JSON.stringify({
        ok: true,
        validation: true,
        message:
          "Validación correcta. El trabajador puede recibir una cuenta.",
        administrator_user_id:
          user.id,
        school_id:
          staff.school_id,
        staff_id:
          staff.id,
        staff_code:
          staff.staff_code,
        person_id:
          staff.person_id,
        email,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    // ============================================
    // ERROR GENERAL
    // ============================================
    console.error(
      "ERROR INTERNO:",
      error,
    );

    return new Response(
      JSON.stringify({
        error:
          "Error interno del servidor",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});