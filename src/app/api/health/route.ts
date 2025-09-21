import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { supabaseAdmin } from '@/lib/db';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('count')
      .limit(1);

    if (error) {
      logger.logError(error as Error, { operation: 'health_check_db' });
      return NextResponse.json({
        status: 'unhealthy',
        checks: {
          database: 'failed',
          error: error.message
        },
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Check environment variables
    const envChecks = {
      supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      openai: !!process.env.OPENAI_API_KEY,
      serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    const allEnvVarsPresent = Object.values(envChecks).every(Boolean);

    const duration = Date.now() - startTime;
    
    logger.info('Health check completed', {
      duration,
      database: 'healthy',
      environment: allEnvVarsPresent ? 'healthy' : 'partial'
    });

    return NextResponse.json({
      status: allEnvVarsPresent ? 'healthy' : 'degraded',
      checks: {
        database: 'healthy',
        environment: envChecks,
        responseTime: `${duration}ms`
      },
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.logError(error as Error, {
      operation: 'health_check',
      duration
    });

    return NextResponse.json({
      status: 'unhealthy',
      checks: {
        database: 'failed',
        error: 'Internal error'
      },
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

export async function HEAD() {
  // Simple HEAD request for basic health check
  return new NextResponse(null, { status: 200 });
}
