"""Shared look and feel for the three FridgeChef apps.

Streamlit's default theme is deliberately neutral. A cooking app should feel
warm, so every screen calls `apply_theme()` once and then uses the small
helpers below instead of raw markdown.
"""
from __future__ import annotations

import streamlit as st

PRIMARY = "#FF6B35"
PRIMARY_DARK = "#E8541F"
ACCENT = "#FF8C42"
CREAM = "#FFF8F0"
CREAM_DEEP = "#FFEEDD"
INK = "#2C3E50"
MUTED = "#7A8899"
BORDER = "#F0DFCE"

_CSS = f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

/* --- hide the Streamlit chrome so screenshots show only the app --- */
[data-testid="stToolbar"], [data-testid="stDecoration"],
[data-testid="stAppDeployButton"], [data-testid="stSidebarCollapseButton"],
[data-testid="stSidebarCollapsedControl"], #MainMenu, footer {{ display: none !important; }}

/* The book prints these screens about six inches wide, so the type has to be
   generous on screen to stay legible on paper. */
html {{ font-size: 17px; }}

html, body, [class*="st-"], button, input, textarea {{
    font-family: 'Nunito', 'Segoe UI', sans-serif;
}}
/* keep Streamlit's icon glyphs on their own font, or they render as words */
[data-testid="stIconMaterial"], .material-symbols-rounded,
span[class*="material-symbols"] {{
    font-family: 'Material Symbols Rounded' !important;
}}

/* --- warm page background --- */
.stApp {{
    background: linear-gradient(180deg, {CREAM} 0%, {CREAM_DEEP} 100%);
    background-attachment: fixed;
    color: {INK};
}}
.block-container {{
    padding: 1rem 1.6rem 1.2rem; max-width: 100%;
}}

/* --- sidebar: narrow, so the content column keeps its width --- */
section[data-testid="stSidebar"] {{
    background: #FFFFFF;
    border-right: 1px solid {BORDER};
    overflow-x: hidden;
    width: 250px !important; min-width: 250px !important;
}}
section[data-testid="stSidebar"] .block-container {{ padding: 1rem .9rem; }}
section[data-testid="stSidebar"] code {{
    white-space: nowrap; font-size: .68rem;
}}

/* --- hero header --- */
/* the hero is deliberately compact so a full screen fits a wide book figure */
.fc-hero {{
    display: flex; align-items: baseline; gap: .9rem;
    margin: 0 0 .9rem; padding-bottom: .7rem;
    border-bottom: 1px solid {BORDER};
}}
.fc-hero h1 {{
    font-size: 1.8rem; font-weight: 800; margin: 0; white-space: nowrap;
    background: linear-gradient(135deg, {PRIMARY}, {ACCENT});
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}}
.fc-hero p {{ color: {MUTED}; font-size: .98rem; margin: 0; }}

/* --- cards --- */
/* --- recipe card --- */
.fc-recipe {{
    background: #FFFFFF;
    border: 1px solid {BORDER};
    border-radius: 12px;
    padding: .9rem 1.2rem 1rem;
    box-shadow: 0 3px 12px rgba(210, 140, 90, .09);
    margin-bottom: .8rem;
}}
.fc-recipe h3 {{ margin: 0; font-size: 1.2rem; font-weight: 800; color: {INK}; }}
.fc-recipe .meta {{ color: {MUTED}; font-size: .87rem; margin: .15rem 0 .7rem; }}
.fc-recipe .cols {{ display: flex; gap: 1.8rem; }}
.fc-recipe .cols > div {{ flex: 1; }}
.fc-recipe h4 {{
    margin: 0 0 .35rem; font-size: .82rem; font-weight: 700; color: {PRIMARY};
    text-transform: uppercase; letter-spacing: .05em;
}}
.fc-recipe ul, .fc-recipe ol {{ margin: 0; padding-left: 1.1rem; }}
.fc-recipe li {{ margin-bottom: .2rem; line-height: 1.4; color: {INK}; font-size: .9rem; }}
.fc-recipe .tip {{
    margin-top: .8rem; padding: .55rem .8rem; border-radius: 8px;
    background: {CREAM_DEEP}; border-left: 4px solid {PRIMARY};
    font-size: .88rem; color: {INK};
}}
.fc-card {{
    background: #FFFFFF;
    border: 1px solid {BORDER};
    border-radius: 12px;
    padding: .75rem 1.1rem;
    box-shadow: 0 3px 12px rgba(210, 140, 90, .09);
    margin-bottom: .8rem;
}}
.fc-card h3 {{ margin: 0; font-size: 1.08rem; font-weight: 700; color: {INK}; }}
.fc-card p {{ margin: .12rem 0 0; color: {MUTED}; font-size: .89rem; }}

/* --- step strip on the landing screen --- */
.fc-steps {{ display: flex; gap: .8rem; margin: 0 0 .9rem; }}
.fc-step {{
    flex: 1; background: #FFFFFF; border: 1px solid {BORDER};
    border-radius: 12px; padding: .7rem .9rem;
    box-shadow: 0 3px 12px rgba(210, 140, 90, .08);
    display: flex; align-items: baseline; gap: .55rem;
}}
.fc-step .n {{
    flex: none;
    display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 50%;
    background: linear-gradient(135deg, {PRIMARY}, {ACCENT});
    color: #FFF; font-weight: 700; font-size: .78rem;
}}
.fc-step b {{ color: {INK}; font-size: .93rem; white-space: nowrap; }}
.fc-step span {{ color: {MUTED}; font-size: .83rem; line-height: 1.35; }}

/* --- recognized ingredients, two columns so the panel stays short --- */
.fc-groups {{
    display: grid; gap: .42rem;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
}}
.fc-group {{
    background: #FFFFFF; border: 1px solid {BORDER}; border-radius: 10px;
    padding: .42rem .75rem;
}}
.fc-group b {{
    display: block; color: {PRIMARY}; font-size: .78rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: .04em; margin-bottom: .15rem;
}}
.fc-group span {{ color: {INK}; font-size: .9rem; line-height: 1.45; }}

/* --- one saved recipe as a list row --- */
.fc-row {{ padding: .35rem 0; }}
.fc-row b {{ display: block; color: {INK}; font-size: 1.02rem; font-weight: 700; }}
.fc-row span {{ color: {MUTED}; font-size: .87rem; }}

/* --- plain bullet list used for short explanatory panels --- */
.fc-list {{ margin: .2rem 0 0; padding: 0; list-style: none; }}
.fc-list li {{
    color: {INK}; font-size: .9rem; padding: .3rem 0 .3rem 1.1rem;
    border-bottom: 1px dashed {BORDER}; position: relative;
}}
.fc-list li:last-child {{ border-bottom: none; }}
.fc-list li::before {{
    content: ""; position: absolute; left: .2rem; top: .72rem;
    width: 6px; height: 6px; border-radius: 50%; background: {PRIMARY};
}}

/* --- buttons --- */
.stButton > button {{
    border-radius: 10px; font-weight: 700; border: 1px solid {BORDER};
    background: #FFFFFF; color: {INK}; transition: all .2s ease;
}}
.stButton > button:hover {{ border-color: {PRIMARY}; color: {PRIMARY}; }}
.stButton > button[kind="primary"] {{
    background: linear-gradient(135deg, {PRIMARY}, {ACCENT});
    color: #FFFFFF; border: none;
    box-shadow: 0 4px 12px rgba(255, 107, 53, .28);
}}
.stButton > button[kind="primary"]:hover {{
    background: linear-gradient(135deg, {PRIMARY_DARK}, {PRIMARY});
    color: #FFFFFF;
}}
.stDownloadButton > button {{ border-radius: 10px; font-weight: 600; }}

/* --- file uploader: kept to one compact row --- */
[data-testid="stFileUploaderDropzone"] {{
    background: #FFFFFF; border: 2px dashed {BORDER}; border-radius: 12px;
    padding: .55rem .9rem; min-height: 0;
}}
[data-testid="stFileUploaderDropzone"]:hover {{ border-color: {PRIMARY}; }}
/* the "Limit 200MB per file" line only costs vertical space here */
[data-testid="stFileUploaderDropzoneInstructions"] small {{ display: none; }}

/* --- tabs --- */
.stTabs [data-baseweb="tab-list"] {{ gap: .4rem; border-bottom: 1px solid {BORDER}; }}
.stTabs [data-baseweb="tab"] {{
    border-radius: 10px 10px 0 0; padding: .5rem 1.1rem;
    font-weight: 600; color: {MUTED};
}}
.stTabs [aria-selected="true"] {{ background: #FFFFFF; color: {PRIMARY}; }}
.stTabs [data-baseweb="tab-highlight"] {{ background: {PRIMARY}; }}

/* --- inputs --- */
.stTextInput input, .stTextArea textarea {{
    border-radius: 10px; background: #FFFFFF;
}}
.stTextInput input:focus {{ border-color: {PRIMARY}; box-shadow: 0 0 0 2px rgba(255,107,53,.15); }}

/* --- expanders, metrics, alerts --- */
[data-testid="stExpander"] {{
    background: #FFFFFF; border: 1px solid {BORDER};
    border-radius: 12px; overflow: hidden;
}}
[data-testid="stMetric"] {{
    background: #FFFFFF; border: 1px solid {BORDER};
    border-radius: 12px; padding: .8rem 1rem;
}}
[data-testid="stMetricValue"] {{ color: {PRIMARY}; font-weight: 800; }}
[data-testid="stAlert"] {{ border-radius: 12px; }}

/* keep the photo preview from pushing the rest of the screen out of view */
[data-testid="stImage"] {{ text-align: center; }}
[data-testid="stImage"] img {{
    max-height: 165px; width: auto; border-radius: 10px;
}}
/* the uploader already lists the file; keep that row tight */
[data-testid="stFileUploaderFile"] {{ padding: .15rem 0; }}

/* --- tighten Streamlit's default vertical rhythm --- */
[data-testid="stVerticalBlock"] {{ gap: .55rem; }}
[data-testid="stElementContainer"] {{ margin-bottom: 0; }}
[data-testid="stMetric"] {{ padding: .5rem .8rem; }}
[data-testid="stMetricValue"] {{ font-size: 1.6rem; }}
[data-testid="stExpander"] summary {{ padding: .35rem .8rem; }}
[data-testid="stExpander"] [data-testid="stExpanderDetails"] {{ padding: .2rem .8rem .5rem; }}
hr {{ margin: .6rem 0; }}

/* --- sliders and radios take the brand colour --- */
[data-testid="stSlider"] [data-baseweb="slider"] div[role="slider"] {{ background: {PRIMARY}; }}
</style>
"""


def apply_theme(page_title: str, step_caption: str) -> None:
    """Set the page config and inject the shared stylesheet."""
    st.set_page_config(
        page_title=page_title, page_icon="🍳", layout="wide",
        initial_sidebar_state="expanded",
    )
    st.markdown(_CSS, unsafe_allow_html=True)
    st.markdown(
        f'<div class="fc-hero"><h1>🍳 FridgeChef</h1><p>{step_caption}</p></div>',
        unsafe_allow_html=True,
    )


def card(title: str, subtitle: str = "") -> None:
    """Render a white heading card above a group of widgets."""
    sub = f"<p>{subtitle}</p>" if subtitle else ""
    st.markdown(f'<div class="fc-card"><h3>{title}</h3>{sub}</div>', unsafe_allow_html=True)


def _escape(text: str) -> str:
    return (
        str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    )


def recipe_card(
    title: str,
    meta_parts: list[str],
    ingredients: list[str],
    steps: list[str],
    tip: str = "",
) -> None:
    """Render one recipe as a single white card."""
    meta = " &middot; ".join(_escape(p) for p in meta_parts if p)
    items = "".join(f"<li>{_escape(i)}</li>" for i in ingredients)
    numbered = "".join(f"<li>{_escape(s)}</li>" for s in steps)
    tip_html = f'<div class="tip"><b>Tip</b> &nbsp;{_escape(tip)}</div>' if tip else ""
    st.markdown(
        f'<div class="fc-recipe"><h3>{_escape(title)}</h3>'
        f'<div class="meta">{meta}</div>'
        f'<div class="cols">'
        f"<div><h4>Ingredients</h4><ul>{items}</ul></div>"
        f"<div><h4>Steps</h4><ol>{numbered}</ol></div>"
        f"</div>{tip_html}</div>",
        unsafe_allow_html=True,
    )


def category_grid(groups: dict[str, list[str]]) -> None:
    """Show recognized ingredients as a compact two-column grid of categories."""
    blocks = "".join(
        f"<div class='fc-group'><b>{_escape(name)} &middot; {len(items)}</b>"
        f"<span>{_escape(', '.join(items))}</span></div>"
        for name, items in groups.items()
    )
    st.markdown(f"<div class='fc-groups'>{blocks}</div>", unsafe_allow_html=True)


def steps_strip(items: list[tuple[str, str]]) -> None:
    """Render the numbered "how it works" strip used on the landing screens."""
    blocks = "".join(
        f'<div class="fc-step"><div class="n">{i}</div>'
        f"<b>{title}</b><span>{text}</span></div>"
        for i, (title, text) in enumerate(items, start=1)
    )
    st.markdown(f'<div class="fc-steps">{blocks}</div>', unsafe_allow_html=True)
