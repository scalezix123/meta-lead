-- Create a function to increment the total_leads count for a page
CREATE OR REPLACE FUNCTION increment_page_leads(p_page_id TEXT, p_workspace_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE facebook_pages
  SET total_leads = COALESCE(total_leads, 0) + 1
  WHERE page_id = p_page_id AND workspace_id = p_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
