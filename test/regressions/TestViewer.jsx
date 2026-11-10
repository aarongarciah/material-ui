import * as React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';
import { StyledEngineProvider, ThemeProvider, createTheme } from '@mui/material/styles';

// The docs render each demo under the page's ThemeProvider, so a demo's own ThemeProvider is nested
// and sets its CSS theme variables on its child instead of `:root`. Render the Material UI demos the same way.
// The `regression-*` fixtures test root providers, the templates are full pages,
// the marketing composites bring their own provider, and the System demos don't use the Material UI theme.
const docsTheme = createTheme();

function isNestedDemo(path) {
  return (
    path.startsWith('/docs-') &&
    !path.startsWith('/docs-getting-started-templates-') &&
    !path.startsWith('/docs-product-') &&
    !path.startsWith('/docs-system-')
  );
}

function TestViewer(props) {
  const { children, path } = props;

  // We're simulating `act(() => ReactDOM.render(children))`
  // In the end children passive effects should've been flushed.
  // React doesn't have any such guarantee outside of `act()` so we're approximating it.
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    function handleFontsEvent(event) {
      if (event.type === 'loading') {
        setReady(false);
      } else if (event.type === 'loadingdone') {
        // Don't know if there could be multiple loaded events after we started loading multiple times.
        // So make sure we're only ready if fonts are actually ready.
        if (document.fonts.status === 'loaded') {
          setReady(true);
        }
      }
    }

    document.fonts.addEventListener('loading', handleFontsEvent);
    document.fonts.addEventListener('loadingdone', handleFontsEvent);

    // In case the child triggered font fetching we're not ready yet.
    // The fonts event handler will mark the test as ready on `loadingdone`
    if (document.fonts.status === 'loaded') {
      setReady(true);
    }

    return () => {
      document.fonts.removeEventListener('loading', handleFontsEvent);
      document.fonts.removeEventListener('loadingdone', handleFontsEvent);
    };
  }, []);

  const viewerBoxSx = {
    display: 'block',
    p: 1,
  };

  const testcase = (
    <Box
      aria-busy={!ready}
      data-testid="testcase"
      data-testpath={path}
      sx={{ bgcolor: 'background.default', ...viewerBoxSx }}
    >
      {children}
    </Box>
  );

  return (
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles
        styles={{
          html: {
            WebkitFontSmoothing: 'antialiased', // Antialiasing.
            MozOsxFontSmoothing: 'grayscale', // Antialiasing.
            // Do the opposite of the docs in order to help catching issues.
            boxSizing: 'content-box',
          },
          '*, *::before, *::after': {
            boxSizing: 'inherit',
            // Disable transitions to avoid flaky screenshots
            transition: 'none !important',
            animation: 'none !important',
          },
          body: {
            margin: 0,
            overflowX: 'hidden',
          },
        }}
      />
      {isNestedDemo(path) ? <ThemeProvider theme={docsTheme}>{testcase}</ThemeProvider> : testcase}
    </StyledEngineProvider>
  );
}

TestViewer.propTypes = {
  children: PropTypes.node.isRequired,
  path: PropTypes.string.isRequired,
};

export default TestViewer;
