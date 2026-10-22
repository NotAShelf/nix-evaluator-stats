import { Component, createSignal, createUniqueId, type JSX, Show } from 'solid-js';
import ChevronDownIcon from 'lucide-solid/icons/chevron-down';

interface SectionProps {
  title: string;
  children: JSX.Element;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const Section: Component<SectionProps> = props => {
  const [collapsed, setCollapsed] = createSignal(props.defaultCollapsed || false);
  const contentId = createUniqueId();

  return (
    <section class={`section ${collapsed() ? 'collapsed' : ''}`} aria-label={props.title}>
      <Show when={props.collapsible}>
        <h2 class="section-heading">
          <button
            class="section-header"
            aria-expanded={!collapsed()}
            aria-controls={contentId}
            onClick={() => setCollapsed(!collapsed())}
          >
            <span class="section-title">{props.title}</span>
            <ChevronDownIcon size={16} class="section-toggle" aria-hidden="true" />
          </button>
        </h2>
      </Show>
      <Show when={!props.collapsible || !collapsed()}>
        <div class="section-content" id={contentId}>
          {props.children}
        </div>
      </Show>
    </section>
  );
};

export default Section;
