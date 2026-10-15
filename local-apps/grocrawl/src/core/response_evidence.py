"""GroCrawl response evidence. HTTP observations are not indexing assertions."""
import re


def robots_directives(values):
    """Preserve each field and user-agent scope, including valued directives."""
    directives = []
    for raw in values:
        scope = '*'
        for part in re.split(r',\s*(?!\d)', raw):
            part = part.strip()
            match = re.match(r'^([\w*-]+):\s*(.*)$', part)
            if match and match.group(1).lower() not in {
                'unavailable_after', 'max-snippet', 'max-image-preview', 'max-video-preview'
            }:
                scope, part = match.group(1).lower(), match.group(2)
            directives.append({'scope': scope, 'directive': part, 'raw': raw})
    return directives


def response_evidence(response):
    values = []
    if getattr(response, 'raw', None) and hasattr(response.raw.headers, 'getlist'):
        values = response.raw.headers.getlist('X-Robots-Tag')
    elif response.headers.get('X-Robots-Tag'):
        values = [response.headers['X-Robots-Tag']]
    return {
        'initial_status': response.history[0].status_code if response.history else response.status_code,
        'final_status': response.status_code,
        'final_url': str(response.url),
        'fetch_state': 'fetched',
        'x_robots_tag': values,
        'robots_directives': robots_directives(values),
    }
