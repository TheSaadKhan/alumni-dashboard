-- RLS Policies for Admin Audit Logs
CREATE POLICY "Organization admins can view their org audit logs" ON public.admin_audit_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'view_audit_logs' = 'true'
      )
    )
  );

CREATE POLICY "System can create audit logs" ON public.admin_audit_logs
  FOR INSERT WITH CHECK (true); -- Managed by backend/service role

CREATE POLICY "Super admins can view all audit logs" ON public.admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.organization_roles oro ON om.role_id = oro.id
      WHERE om.user_id = auth.uid() 
        AND om.is_active = true
        AND oro.name = 'super_admin'
    )
  );

-- RLS Policies for Audit Log Configurations
CREATE POLICY "Organization admins can manage audit configs" ON public.audit_log_configurations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_audit_logs' = 'true'
      )
    )
  );

-- RLS Policies for Audit Log Alerts
CREATE POLICY "Organization admins can view audit alerts" ON public.audit_log_alerts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'view_audit_logs' = 'true'
      )
    )
  );

CREATE POLICY "Organization admins can manage audit alerts" ON public.audit_log_alerts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_audit_logs' = 'true'
      )
    )
  );

-- RLS Policies for Audit Log Exports
CREATE POLICY "Users can view their own audit exports" ON public.audit_log_exports
  FOR SELECT USING (
    requested_by_member_id IN (
      SELECT id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Organization admins can manage audit exports" ON public.audit_log_exports
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_audit_logs' = 'true'
      )
    )
  );