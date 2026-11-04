from pipeline.e2e_users import replace_env_lines


def test_replace_env_lines_keeps_other_lines_and_replaces_ours():
    text = "SUPABASE_URL=x\nE2E_EMAIL_A=velho\n"
    result = replace_env_lines(text, {"E2E_EMAIL_A": "novo", "E2E_PASSWORD_A": "p"})
    assert result == "SUPABASE_URL=x\nE2E_EMAIL_A=novo\nE2E_PASSWORD_A=p\n"
